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

export function forgotPassword(email) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function resetPassword({ email, otpCode, newPassword }) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword }),
  })
}
