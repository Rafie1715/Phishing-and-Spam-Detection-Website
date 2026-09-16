const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = (configuredBaseUrl || 'http://localhost:8000').replace(/\/$/, '')
export const IS_API_ENABLED = import.meta.env.VITE_API_ENABLED !== 'false'

function getErrorMessage(data, status) {
  const detail = data?.detail

  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg).filter(Boolean).join(', ') || `Permintaan gagal (${status}).`
  }

  if (typeof detail === 'string') return detail
  if (typeof data?.message === 'string') return data.message
  return `Permintaan gagal (${status}).`
}

export async function apiRequest(path, { accessToken, headers: customHeaders, ...options } = {}) {
  if (!IS_API_ENABLED) throw new Error('API backend sedang dinonaktifkan.')

  const headers = new Headers(customHeaders)
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    })
  } catch {
    throw new Error(`Backend tidak dapat dijangkau di ${API_BASE_URL}. Pastikan FastAPI sudah berjalan.`)
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

  try {
    const response = await fetch(`${API_BASE_URL}/docs`, { method: 'GET' })
    return response.ok
  } catch {
    return false
  }
}
