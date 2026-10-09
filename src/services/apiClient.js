const env = import.meta.env ?? {}
const configuredBaseUrl = env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = (configuredBaseUrl || 'https://scam-project-backend.vercel.app').replace(/\/+$/, '')
export const IS_API_ENABLED = env.VITE_API_ENABLED !== 'false'
const configuredTimeout = Number(env.VITE_API_TIMEOUT_MS || 60000)
const REQUEST_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 60000

function getErrorMessage(data, status) {
  if (status === 413) return 'Gambar terlalu besar untuk layanan. Gunakan gambar maksimal 4 MB.'
  if (status === 429) return 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.'
  if (status >= 500) return 'Layanan sedang mengalami gangguan. Silakan coba lagi beberapa saat.'
  const detail = data?.detail

  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg).filter(Boolean).join(', ') || `Permintaan gagal (${status}).`
  }

  if (typeof detail === 'string') return detail
  if (typeof data?.message === 'string') return data.message
  if (status === 401) return 'Sesi Anda sudah berakhir. Silakan masuk kembali.'
  if (status === 403) return 'Anda tidak memiliki akses untuk permintaan ini.'
  return `Permintaan gagal (${status}).`
}

let refreshPromise = null
let accessTokenListener = null
let sessionVersion = 0

export function invalidateAccessToken() {
  sessionVersion += 1
  refreshPromise = null
}

export function setAccessTokenListener(listener) {
  accessTokenListener = listener
}

// Meminta access token baru memakai cookie refresh_token (httpOnly).
// Permintaan yang bersamaan memakai satu proses refresh yang sama.
export function refreshAccessToken() {
  if (!refreshPromise) {
    const version = sessionVersion
    const pendingRefresh = apiRequest('/auth/refresh', { method: 'POST', skipRefresh: true })
      .then((token) => {
        if (version !== sessionVersion) {
          const error = new Error('Sesi sudah berubah. Silakan masuk kembali.')
          error.status = 401
          throw error
        }
        if (typeof token?.access_token !== 'string' || !token.access_token.trim()) {
          const error = new Error('Respons token tidak valid. Silakan masuk kembali.')
          error.code = 'INVALID_RESPONSE'
          throw error
        }
        accessTokenListener?.(token.access_token)
        return token.access_token
      })
      .finally(() => {
        if (refreshPromise === pendingRefresh) refreshPromise = null
      })
    refreshPromise = pendingRefresh
  }
  return refreshPromise
}

export async function apiRequest(path, { accessToken, headers: customHeaders, timeoutMs = REQUEST_TIMEOUT_MS, skipRefresh = false, ...options } = {}) {
  if (!IS_API_ENABLED) throw new Error('API backend sedang dinonaktifkan.')
  const requestVersion = sessionVersion

  const headers = new Headers(customHeaders)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const baseUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && API_BASE_URL === 'https://scam-project-backend.vercel.app' ? '/api-proxy' : API_BASE_URL
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
    // Read the body inside the timeout too; hosting errors may return HTML, not JSON.
    const body = response.status === 204 ? '' : await response.text()
    let data = null
    try { data = body ? JSON.parse(body) : null } catch { /* Handled below. */ }
    // Retry once only, and keep the response-body timeout on each request.
    if (response.status === 401 && accessToken && !skipRefresh && requestVersion === sessionVersion) {
      clearTimeout(timer)
      let newAccessToken
      try { newAccessToken = await refreshAccessToken() } catch { /* Report original 401 below. */ }
      if (newAccessToken) {
        return apiRequest(path, { ...options, headers: customHeaders, timeoutMs, accessToken: newAccessToken, skipRefresh: true })
      }
    }
    if (!response.ok) {
      const error = new Error(getErrorMessage(data, response.status))
      error.status = response.status
      throw error
    }
    if (response.status !== 204 && (data === null || typeof data !== 'object')) {
      const error = new Error('Respons layanan tidak valid. Silakan coba lagi.')
      error.code = 'INVALID_RESPONSE'
      throw error
    }
    return data
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Permintaan terlalu lama. Periksa koneksi Anda lalu coba lagi.')
    if (error?.status || error?.code === 'INVALID_RESPONSE') throw error
    throw new Error('Layanan belum dapat dijangkau. Periksa koneksi atau coba lagi. Jika berlanjut, konfigurasi CORS backend perlu diperiksa.')
  } finally {
    clearTimeout(timer)
  }
}

export async function checkApiConnection() {
  if (!IS_API_ENABLED) return false

  try {
    const data = await apiRequest('/health', { method: 'GET', timeoutMs: 15000 })
    return data?.status === 'ok'
  } catch {
    return false
  }
}
