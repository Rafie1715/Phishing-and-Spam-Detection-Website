import { apiRequest } from './apiClient.js'

export function getDetectionHistory(accessToken, page = 1, size = 8) {
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
