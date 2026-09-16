import { apiRequest } from './apiClient.js'

export function registerUser({ name, email, password }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export function verifyOtp({ email, otpCode }) {
  return apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp_code: otpCode }),
  })
}

export function resendOtp(email) {
  return apiRequest('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function loginUser({ email, password }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getCurrentUser(accessToken) {
  return apiRequest('/auth/me', { method: 'GET', accessToken })
}

export function getDetectionHistory(accessToken, page = 1, size = 10) {
  return apiRequest(`/detection/history?page=${page}&size=${size}`, {
    method: 'GET',
    accessToken,
  })
}

export function deleteDetection(accessToken, detectionId) {
  return apiRequest(`/detection/history/${detectionId}`, {
    method: 'DELETE',
    accessToken,
  })
}
