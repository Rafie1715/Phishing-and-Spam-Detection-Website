// Local browser smoke check. Start Vite and Edge with --remote-debugging-port=9225 first.
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const targets = await fetch('http://127.0.0.1:9225/json/list').then(r => r.json())
const target = targets.find(item => item.type === 'page')
if (!target) throw new Error('No review browser tab available.')
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
let sequence = 0
const pending = new Map()
const errors = []
const requests = []
ws.onmessage = ({ data }) => {
  const message = JSON.parse(data)
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
  if (message.method === 'Network.requestWillBeSent') requests.push(message.params.request.url)
  if (message.id) {
    const waiter = pending.get(message.id)
    pending.delete(message.id)
    clearTimeout(waiter.timer)
    if (message.error) waiter.reject(new Error(message.error.message))
    else waiter.resolve(message.result)
  }
}
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence
  const timer = setTimeout(() => { pending.delete(id); reject(new Error('Timed out: ' + method)) }, 15000)
  pending.set(id, { resolve, reject, timer })
  ws.send(JSON.stringify({ id, method, params }))
})
if (process.argv.includes('--close')) {
  await send('Browser.close')
  ws.close()
  process.exit(0)
}
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
  return response.result.value
}
const waitFor = async expression => {
  const limit = Date.now() + 8000
  while (Date.now() < limit) {
    if (await evaluate(expression)) return
    await new Promise(resolve => setTimeout(resolve, 80))
  }
  throw new Error('Expected browser state: ' + expression)
}
const click = async selector => {
  assert.equal(await evaluate(`document.querySelectorAll(${JSON.stringify(selector)}).length`), 1, selector)
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
}
const viewport = (width, height = 960) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
const screenshot = async name => {
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  await writeFile(new URL('../artifacts/' + name + '.png', import.meta.url), Buffer.from(data, 'base64'))
}
await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true })
const checks = []
try {
  await send('Runtime.enable')
  await send('Network.enable')
  await send('Page.enable')
  await viewport(1440, 1100)
  await send('Page.navigate', { url: 'http://localhost:5173/' })
  await waitFor('Boolean(document.querySelector(".scan-tabs"))')
  if (process.argv.includes('--backend')) {
    const connection = await evaluate(`(async () => {
      const { API_BASE_URL, checkApiConnection, apiRequest } = await import('/src/services/apiClient.js')
      const online = await checkApiConnection()
      const statuses = []
      for (const [path, options] of [
        ['/auth/me', { method: 'GET' }],
        ['/auth/login', { method: 'POST', body: '{}' }],
      ]) {
        try { await apiRequest(path, options); statuses.push(200) }
        catch (error) { statuses.push(error.status ?? error.message) }
      }
      return { baseUrl: API_BASE_URL, online, statuses }
    })()`)
    assert.equal(connection.baseUrl, 'https://scam-project-backend.vercel.app')
    assert.equal(connection.online, true, 'Live health endpoint must be reachable from browser')
    assert.deepEqual(connection.statuses, [401, 422], 'Browser must be allowed to read auth errors via CORS')
    await waitFor('document.querySelector(".service-status")?.textContent.includes("Layanan terhubung")')
    checks.push('Live backend health, credentialed CORS, unauthenticated 401 and login validation 422')
  }
  await evaluate('document.fonts.ready.then(() => true)')
  await screenshot('sentry-desktop')
  for (const width of [320, 390, 768, 1440]) {
    await viewport(width)
    await waitFor(`window.innerWidth === ${width}`)
    const dimensions = await evaluate('({ width: innerWidth, content: document.documentElement.scrollWidth })')
    assert.ok(dimensions.content <= dimensions.width, 'Horizontal overflow at ' + width + ': ' + JSON.stringify(dimensions))
    checks.push('No horizontal overflow: ' + width + 'px')
    if (width === 390) await screenshot('sentry-mobile')
  }
  await click('.radar-caption button')
  await waitFor('getComputedStyle(document.querySelector(".radar-sweep")).animationPlayState === "paused"')
  await click('.radar-caption button')
  await waitFor('getComputedStyle(document.querySelector(".radar-sweep")).animationPlayState === "running"')
  checks.push('Radar animation can be paused and resumed')
  await click('.input-meta button')
  await waitFor('document.querySelector(".result-filled")?.textContent.includes("CONTOH SIMULASI")')
  assert.ok(!requests.some(url => /\/detection\//.test(url)), 'Demo must not call detection backend')
  await evaluate('document.querySelector("#scanner").scrollIntoView({behavior:"instant"})')
  await screenshot('sentry-result')
  checks.push('URL simulation clearly labeled, no detection request')
  await click('#tab-message')
  await waitFor('Boolean(document.querySelector("#message-input"))')
  await click('.input-meta button')
  await waitFor('document.querySelector("#message-input").value.length > 20 && Boolean(document.querySelector(".result-filled"))')
  checks.push('Message input and simulation')
  await evaluate('document.querySelector("#tab-message").focus()')
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 })
  await waitFor('document.activeElement.id === "tab-image" && Boolean(document.querySelector("#image-input"))')
  checks.push('Keyboard tab navigation')
  await click('.input-meta button')
  await waitFor('document.querySelector(".image-preview img")?.complete && Boolean(document.querySelector(".result-filled"))')
  await click('.image-preview button')
  await waitFor('Boolean(document.querySelector(".upload-button"))')
  await evaluate(`(() => { const input = document.querySelector('#image-input'); const data = new DataTransfer(); data.items.add(new File(['test'], 'test.txt', {type:'text/plain'})); input.files = data.files; input.dispatchEvent(new Event('change', {bubbles:true})); })()`)
  await waitFor('document.querySelector(".scan-error")?.textContent.includes("Format belum didukung")')
  await evaluate(`(async () => { const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 200; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#eee'; ctx.fillRect(0,0,400,200); ctx.fillStyle = '#222'; ctx.fillText('Test screenshot', 20,40); const blob = await new Promise(resolve => canvas.toBlob(resolve)); const input = document.querySelector('#image-input'); const data = new DataTransfer(); data.items.add(new File([blob], 'review.png', {type:'image/png'})); input.files = data.files; input.dispatchEvent(new Event('change', {bubbles:true})); })()`)
  await waitFor('document.querySelector(".image-preview img")?.naturalWidth === 400 && !document.querySelector(".simulation-note")')
  checks.push('Screenshot preview, clear action, and unsupported-file validation')
  await viewport(390, 844)
  await evaluate('window.scrollTo({top:0,behavior:"instant"})')
  await click('.menu-button')
  await waitFor('document.querySelector("#mobile-nav").hidden === false')
  await click('#mobile-nav a[href="#wawasan"]')
  await waitFor('document.querySelector("#mobile-nav").hidden === true')
  await evaluate('document.querySelector("#wawasan").scrollIntoView({behavior:"instant"})')
  await waitFor('document.querySelector(".desktop-nav a[href$=wawasan]").hasAttribute("aria-current")')
  checks.push('Mobile navigation and active section')
  await click('.field-note:first-child .note-toggle')
  await waitFor('document.querySelector("#note-detail-0").hidden === false')
  await click('.faq-list article:nth-child(2) button')
  await waitFor('document.querySelector("#faq-1").hidden === false && document.querySelector("#faq-0").hidden === true')
  checks.push('Field notes and FAQ expansion')
  await viewport(1440, 1000)
  await evaluate('document.querySelector("#wawasan").scrollIntoView({behavior:"instant"})')
  await screenshot('sentry-field-notes')
  await viewport(390, 844)
  await click('.header-actions .account-button')
  await waitFor('Boolean(document.querySelector(".auth-dialog"))')
  await screenshot('sentry-auth-mobile')
  assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Auth mobile overflow')
  await evaluate(`(() => { const buttons = document.querySelectorAll('.auth-dialog button'); buttons[buttons.length - 1].focus(); })()`)
  await send('Input.dispatchKeyEvent', { type:'keyDown', key:'Tab', code:'Tab', windowsVirtualKeyCode:9 })
  await waitFor('document.activeElement === document.querySelector(".auth-dialog button[aria-label]")')
  checks.push('Authentication keyboard focus stays inside dialog')
  await evaluate('document.querySelector(".auth-dialog form button[type=button]").click()')
  await waitFor('document.querySelector("#auth-title").textContent.includes("Lupa")')
  await send('Input.dispatchKeyEvent', { type:'keyDown', key:'Escape', code:'Escape', windowsVirtualKeyCode:27 })
  await waitFor('!document.querySelector(".auth-dialog")')
  checks.push('Mobile login, recovery view, and Escape dismissal')
  assert.equal(errors.length, 0, JSON.stringify(errors))
  checks.push('No uncaught browser exceptions')
  await writeFile(new URL('../artifacts/ui-review.json', import.meta.url), JSON.stringify({ checks, errors }, null, 2))
  console.log(JSON.stringify({ checks, errors }, null, 2))
} finally {
  ws.close()
}
