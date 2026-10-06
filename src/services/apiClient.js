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

<<<<<<< HEAD
export async function apiRequest(path, { accessToken, headers: customHeaders, timeoutMs = REQUEST_TIMEOUT_MS, ...options } = {}) {
=======
async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Permintaan terlalu lama. Periksa koneksi Anda lalu coba lagi.')
    }
    throw error
  } finally {
    window.clearTimeout(timer)
  }
}

let refreshPromise = null
let accessTokenListener = null

export function setAccessTokenListener(listener) {
  accessTokenListener = listener
}

// Meminta access token baru memakai cookie refresh_token (httpOnly).
// Permintaan yang bersamaan memakai satu proses refresh yang sama.
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = apiRequest('/auth/refresh', { method: 'POST', skipRefresh: true })
      .then((token) => {
        accessTokenListener?.(token.access_token)
        return token.access_token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

export async function apiRequest(path, { accessToken, headers: customHeaders, timeoutMs, skipRefresh = false, ...options } = {}) {
>>>>>>> 4ae5a15ac0841ee2cacd6e1b4b1c101db34e3819
  if (!IS_API_ENABLED) throw new Error('API backend sedang dinonaktifkan.')

  const headers = new Headers(customHeaders)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
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
<<<<<<< HEAD
=======

  // Access token kedaluwarsa: refresh sekali, lalu ulangi permintaan dengan token baru.
  if (response.status === 401 && accessToken && !skipRefresh) {
    let newAccessToken
    try {
      newAccessToken = await refreshAccessToken()
    } catch {
      newAccessToken = null
    }
    if (newAccessToken) {
      return apiRequest(path, { ...options, headers: customHeaders, timeoutMs, accessToken: newAccessToken, skipRefresh: true })
    }
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(getErrorMessage(data, response.status))
    error.status = response.status
    throw error
  }

  return data
>>>>>>> 4ae5a15ac0841ee2cacd6e1b4b1c101db34e3819
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
