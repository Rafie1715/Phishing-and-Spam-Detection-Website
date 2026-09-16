const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = (configuredBaseUrl || 'http://localhost:8000').replace(/\/$/, '')
export const IS_API_ENABLED = import.meta.env.VITE_API_ENABLED !== 'false'
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 20000)

function getErrorMessage(data, status) {
  const detail = data?.detail

  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg).filter(Boolean).join(', ') || `Permintaan gagal (${status}).`
  }

  if (typeof detail === 'string') return detail
  if (typeof data?.message === 'string') return data.message
  return `Permintaan gagal (${status}).`
}

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

export async function apiRequest(path, { accessToken, headers: customHeaders, timeoutMs, ...options } = {}) {
  if (!IS_API_ENABLED) throw new Error('API backend sedang dinonaktifkan.')

  const headers = new Headers(customHeaders)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  let response
  try {
    response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    }, timeoutMs)
  } catch (error) {
    if (error instanceof Error && error.message.includes('terlalu lama')) throw error
    throw new Error('Layanan analisis belum dapat dijangkau. Periksa koneksi lalu coba kembali.')
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(getErrorMessage(data, response.status))
    error.status = response.status
    throw error
  }

  return data
}

export async function checkApiConnection() {
  if (!IS_API_ENABLED) return false

  for (const path of ['/health', '/docs']) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, { method: 'GET' }, 4500)
      if (response.ok) return true
    } catch {
      // Coba endpoint kompatibilitas berikutnya.
    }
  }

  return false
}
