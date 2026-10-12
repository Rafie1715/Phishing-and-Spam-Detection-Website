// Run with Vite on localhost:5173 and an isolated Edge on debugging port 9225.
// Every API response is mocked before navigation: no quota, account, or email is used.
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const tabs = await fetch('http://127.0.0.1:9225/json/list').then(response => response.json())
const target = tabs.find(tab => tab.type === 'page')
assert.ok(target, 'Start an isolated review browser first')
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
let sequence = 0
const pending = new Map()
const errors = []
ws.onmessage = ({ data }) => {
  const message = JSON.parse(data)
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
  if (!message.id) return
  const waiter = pending.get(message.id)
  if (!waiter) return
  pending.delete(message.id)
  clearTimeout(waiter.timer)
  if (message.error) waiter.reject(new Error(message.error.message))
  else waiter.resolve(message.result)
}
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence
  const timer = setTimeout(() => { pending.delete(id); reject(new Error('Timeout: ' + method)) }, 15000)
  pending.set(id, { resolve, reject, timer })
  ws.send(JSON.stringify({ id, method, params }))
})
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}
const waitFor = async expression => {
  const deadline = Date.now() + 10000
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return
    await new Promise(resolve => setTimeout(resolve, 80))
  }
  throw new Error('Expected: ' + expression)
}
const click = async selector => {
  assert.equal(await evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`), 1)
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
}
const fill = (selector, value) => evaluate(`(() => {
  const element = document.querySelector(${JSON.stringify(selector)})
  const prototype = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)})
  element.dispatchEvent(new Event('input', { bubbles: true }))
})()`)
const checks = []
try {
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__guestReview = { requests: [], outcome: 'success' }
    const originalFetch = window.fetch.bind(window)
    window.fetch = async (input, options = {}) => {
      const url = String(input)
      if (!url.includes('/api-proxy/') && !url.includes('scam-project-backend.vercel.app')) return originalFetch(input, options)
      const state = window.__guestReview
      const auth = new Headers(options.headers).get('Authorization')
      state.requests.push({ url, auth })
      if (url.endsWith('/health')) return Response.json({ status: 'ok' })
      if (url.endsWith('/auth/refresh')) return Response.json({ detail: 'No session' }, { status: 401 })
      if (url.endsWith('/auth/login')) return Response.json({ access_token: 'local-test-token' })
      if (url.endsWith('/auth/me')) return Response.json({ id: 1, name: 'Local Test', email: 'test@example.invalid', is_verified: true })
      if (url.includes('/detection/')) {
        if (!auth && state.outcome === 'rate-limit') return Response.json({ detail: 'Too many requests' }, { status: 429 })
        if (!auth && state.outcome === 'guest-limit') return Response.json({ detail: { code: 'guest_limit_reached' } }, { status: 429 })
        return Response.json({ id: 42, verdict: 'safe', confidence_score: 0.95, category: 'normal', extracted_text: null }, { status: 201 })
      }
      return Response.json({ detail: 'Unmocked test endpoint' }, { status: 404 })
    }
  ` })
  await send('Page.navigate', { url: 'http://localhost:5173/' })
  await waitFor('Boolean(document.querySelector("#url-input"))')
  await fill('#url-input', 'https://example.com/guest-test')
  await click('.scan-submit')
  await waitFor('Boolean(document.querySelector(".result-filled"))')
  assert.equal(await evaluate('Boolean(document.querySelector(".auth-dialog"))'), false)
  assert.equal(await evaluate('window.__guestReview.requests.find(r => r.url.endsWith("/detection/url")).auth'), null)
  checks.push('Guest URL analysis works without login or Bearer token')

  await click('#tab-message')
  await fill('#message-input', 'Pesan uji lokal yang harus tetap tersimpan.')
  await evaluate('window.__guestReview.outcome = "rate-limit"')
  await click('.scan-submit')
  await waitFor('document.querySelector(".scan-error")?.textContent.includes("Terlalu banyak")')
  assert.equal(await evaluate('Boolean(document.querySelector(".guest-limit-notice"))'), false)
  checks.push('Ordinary 429 does not require login')

  await evaluate('window.__guestReview.outcome = "guest-limit"')
  await click('.scan-submit')
  await waitFor('Boolean(document.querySelector(".guest-limit-notice"))')
  await waitFor('document.activeElement === document.querySelector(".guest-limit-notice")')
  const requestCount = await evaluate('window.__guestReview.requests.length')
  await click('.scan-submit')
  await waitFor('Boolean(document.querySelector(".auth-dialog"))')
  assert.equal(await evaluate('window.__guestReview.requests.length'), requestCount)
  await click('.auth-dialog button[aria-label="Tutup dialog autentikasi"]')
  await waitFor('!document.querySelector(".auth-dialog")')
  checks.push('Guest limit is announced and subsequent submit opens login without another API call')

  for (const width of [320, 390, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false })
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Overflow at ' + width)
  }
  await evaluate('document.querySelector(".guest-limit-notice").scrollIntoView({block:"center",behavior:"instant"})')
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true })
  await writeFile(new URL('../artifacts/guest-limit.png', import.meta.url), Buffer.from(shot.data, 'base64'))

  await click('.guest-limit-notice button:nth-child(2)')
  await waitFor('Boolean(document.querySelector(".auth-dialog input[autocomplete=name]"))')
  await click('.auth-dialog button[aria-label="Tutup dialog autentikasi"]')
  await waitFor('!document.querySelector(".auth-dialog")')
  assert.equal(await evaluate('document.querySelector("#message-input").value'), 'Pesan uji lokal yang harus tetap tersimpan.')
  checks.push('Sign-up opens the correct form and preserves the scan input')

  await click('.guest-limit-notice button:first-child')
  await waitFor('Boolean(document.querySelector(".auth-dialog input[type=password]"))')
  await fill('.auth-dialog input[type=email]', 'test@example.invalid')
  await fill('.auth-dialog input[type=password]', 'local-test-only')
  await evaluate('document.querySelector(".auth-dialog form").requestSubmit()')
  await waitFor('!document.querySelector(".auth-dialog") && !document.querySelector(".guest-limit-notice")')
  await click('.scan-submit')
  await waitFor('Boolean(document.querySelector(".result-filled"))')
  assert.equal(await evaluate('window.__guestReview.requests.filter(r => r.url.includes("/detection/")).at(-1).auth'), 'Bearer local-test-token')
  checks.push('Mocked login clears guest gate and allows authenticated analysis with preserved input')
  assert.equal(errors.length, 0, JSON.stringify(errors))
  await writeFile(new URL('../artifacts/guest-review.json', import.meta.url), JSON.stringify({ checks, errors }, null, 2))
  console.log(JSON.stringify({ checks, errors }, null, 2))
} finally {
  ws.close()
}
