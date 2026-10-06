import { test, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { API_BASE_URL, apiRequest, checkApiConnection } from '../src/services/apiClient.js'
import { detectThreat, MAX_IMAGE_BYTES } from '../src/services/detectionService.js'
import { loginUser, registerUser, verifyOtp, resendOtp, forgotPassword, resetPassword, getCurrentUser, logoutUser } from '../src/services/authService.js'
import { getDetectionHistory, deleteDetection } from '../src/services/historyService.js'

afterEach(() => mock.restoreAll())
const result = { id: 42, verdict: 'scam', confidence_score: 0.97, category: 'penipuan', extracted_text: null }
function respond(data = result, status = 200) {
  return mock.method(globalThis, 'fetch', async () => new Response(status === 204 ? null : JSON.stringify(data), { status }))
}

test('default URL targets deployed API', () => {
  assert.equal(API_BASE_URL, 'https://scam-project-backend.vercel.app')
})

test('JSON analysis sends Bearer, credentials and preserves original HTTP scheme', async () => {
  const fetchMock = respond()
  const output = await detectThreat({ mode: 'url', value: ' http://example.com/path ', accessToken: 'test-token' })
  const [url, options] = fetchMock.mock.calls[0].arguments
  assert.equal(url, `${API_BASE_URL}/detection/text`)
  assert.deepEqual(JSON.parse(options.body), { text: 'http://example.com/path' })
  assert.equal(options.headers.get('Authorization'), 'Bearer test-token')
  assert.equal(options.headers.get('Content-Type'), 'application/json')
  assert.equal(options.credentials, 'include')
  assert.equal(output.score, 97)
  assert.equal(output.metric, 'confidence')
  assert.equal(output.level, 'high')
  assert.equal(output.source, 'model')
})

test('URL without scheme gets HTTPS; message is sent as text', async () => {
  const fetchMock = respond()
  await detectThreat({ mode: 'url', value: 'example.com', accessToken: 'test-token' })
  await detectThreat({ mode: 'message', value: 'Pesan untuk diperiksa', accessToken: 'test-token' })
  assert.equal(JSON.parse(fetchMock.mock.calls[0].arguments[1].body).text, 'https://example.com')
  assert.equal(JSON.parse(fetchMock.mock.calls[1].arguments[1].body).text, 'Pesan untuk diperiksa')
})

test('screenshot uses multipart file field with browser-owned content type', async () => {
  const fetchMock = respond()
  const file = new File(['test-image'], 'test.png', { type: 'image/png' })
  await detectThreat({ mode: 'image', file, accessToken: 'test-token' })
  const [url, options] = fetchMock.mock.calls[0].arguments
  assert.equal(url, `${API_BASE_URL}/detection/image`)
  assert.equal(options.body.get('file').name, 'test.png')
  assert.equal(options.headers.has('Content-Type'), false)
})

test('missing authentication and invalid screenshots do not send requests', async () => {
  const fetchMock = respond()
  await assert.rejects(detectThreat({ mode: 'message', value: 'test' }), { status: 401 })
  for (const file of [null, new File(['x'], 'bad.svg', { type: 'image/svg+xml' }), new File([], 'empty.png', { type: 'image/png' }), new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'large.png', { type: 'image/png' })]) {
    await assert.rejects(detectThreat({ mode: 'image', file, accessToken: 'test-token' }))
  }
  assert.equal(fetchMock.mock.callCount(), 0)
})

test('invalid model verdict and confidence are rejected rather than shown as safe', async () => {
  for (const invalid of [{}, { ...result, verdict: 'unknown' }, { ...result, confidence_score: null }, { ...result, confidence_score: 97 }]) {
    respond(invalid)
    await assert.rejects(detectThreat({ mode: 'message', value: 'test', accessToken: 'test-token' }), /Format hasil analisis tidak valid/)
    mock.restoreAll()
  }
})

test('all model verdicts map to correct UI levels without treating confidence as risk', async () => {
  for (const [verdict, level] of [['safe', 'low'], ['suspicious', 'medium'], ['scam', 'high']]) {
    respond({ ...result, verdict })
    const output = await detectThreat({ mode: 'message', value: 'test', accessToken: 'test-token' })
    assert.equal(output.level, level)
    assert.equal(output.metric, 'confidence')
    mock.restoreAll()
  }
})

test('auth services match deployed JSON field names (mocked, no emails sent)', async () => {
  const fetchMock = respond({ message: 'ok' })
  const email = 'test@example.com'
  await registerUser({ name: 'Test', email, password: 'test-only' })
  await loginUser({ email, password: 'test-only' })
  await verifyOtp({ email, otpCode: '123456' })
  await resendOtp(email)
  await forgotPassword(email)
  await resetPassword({ email, otpCode: '123456', newPassword: 'new-test-only' })
  await getCurrentUser('test-token')
  await logoutUser()
  assert.deepEqual(fetchMock.mock.calls.map(({ arguments: [url] }) => url.replace(API_BASE_URL, '')), [
    '/auth/register', '/auth/login', '/auth/verify-otp', '/auth/resend-otp', '/auth/forgot-password', '/auth/reset-password', '/auth/me', '/auth/logout',
  ])
  assert.deepEqual(JSON.parse(fetchMock.mock.calls[2].arguments[1].body), { email, otp_code: '123456' })
  assert.deepEqual(JSON.parse(fetchMock.mock.calls[5].arguments[1].body), { email, otp_code: '123456', new_password: 'new-test-only' })
  assert.equal(fetchMock.mock.calls[6].arguments[1].headers.get('Authorization'), 'Bearer test-token')
  assert.equal(fetchMock.mock.calls[7].arguments[1].method, 'POST')
})

test('history pagination and 204 deletion match API contract', async () => {
  const fetchMock = respond({ items: [], total: 0, page: 2, size: 8, total_pages: 0 })
  await getDetectionHistory('test-token', 2)
  assert.equal(fetchMock.mock.calls[0].arguments[0], `${API_BASE_URL}/detection/history?page=2&size=8`)
  mock.restoreAll()
  const deleteMock = respond(null, 204)
  assert.equal(await deleteDetection('test-token', 42), null)
  assert.equal(deleteMock.mock.calls[0].arguments[1].method, 'DELETE')
})

test('HTTP errors preserve status and show useful errors for non-JSON hosting responses', async () => {
  for (const [status, message] of [[413, /4 MB/], [429, /Terlalu banyak/], [502, /gangguan/], [401, /masuk kembali/]]) {
    mock.method(globalThis, 'fetch', async () => new Response('<html>Error</html>', { status }))
    await assert.rejects(apiRequest('/test'), error => error.status === status && message.test(error.message))
    mock.restoreAll()
  }
  respond({ detail: [{ msg: 'Field required' }] }, 422)
  await assert.rejects(apiRequest('/test'), { status: 422, message: 'Field required' })
})

test('malformed successful response is not silently accepted', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('<html>Deployment</html>'))
  await assert.rejects(apiRequest('/test'), { code: 'INVALID_RESPONSE' })
})

test('timeout covers response body download, not just headers', async () => {
  mock.method(globalThis, 'fetch', async (_url, { signal }) => ({
    status: 200, ok: true,
    text: () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })),
  }))
  await assert.rejects(apiRequest('/slow', { timeoutMs: 20 }), /terlalu lama/)
})

test('health requires real ok payload and does not use docs as fallback', async () => {
  respond({ status: 'ok' })
  assert.equal(await checkApiConnection(), true)
  mock.restoreAll()
  const fetchMock = respond({ status: 'unhealthy' })
  assert.equal(await checkApiConnection(), false)
  assert.equal(fetchMock.mock.callCount(), 1)
})
