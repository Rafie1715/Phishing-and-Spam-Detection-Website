import { apiRequest, IS_API_ENABLED } from './apiClient.js'

function mockTextAnalysis(value, mode) {
  const text = value.toLowerCase()
  const found = []
  let score = 6
  const add = (key, points) => {
    if (!found.includes(key)) {
      found.push(key)
      score += points
    }
  }

  if (/\.(xyz|top|click|buzz|work|gq|tk|ml)(\/|\?|$)/i.test(text)) add('suspiciousTld', 24)
  if (/(urgent|segera|sekarang|hari ini|diblokir|ditutup|24 jam|peringatan|terakhir)/i.test(text)) add('urgency', 18)
  if (/(password|kata sandi|otp|pin|cvv|nomor kartu|seed phrase|data pribadi)/i.test(text)) add('credentials', 27)
  if (/(bank|bca|bni|bri|mandiri|paypal|netflix|google|microsoft|dana|ovo|shopee).{0,18}(login|secure|verifikasi|support|hadiah)/i.test(text)) add('impersonation', 20)
  if (/@|%[0-9a-f]{2}|\d{1,3}(\.\d{1,3}){3}|xn--|[Il1]{3,}/i.test(text) && mode === 'url') add('obfuscation', 17)
  if (/(bit\.ly|tinyurl|t\.co|cutt\.ly|s\.id)/i.test(text)) add('shortened', 13)
  if (/(gratis|hadiah|menang|undian|bonus|claim|klaim|klik tautan)/i.test(text)) add('urgency', 14)
  if (!found.length) found.push('secure')
  return buildResult(Math.min(97, score), found)
}

function mockImageAnalysis() {
  return buildResult(84, ['visualBrand', 'visualUrgency', 'visualForm', 'credentials'])
}

function buildResult(score, found, source = 'demo') {
  return {
    score,
    metric: 'risk',
    metricLabel: 'Skor risiko',
    found,
    level: score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low',
    reportId: Math.floor(10000 + Math.random() * 89999),
    source,
  }
}

function normalizeModelResult(data) {
  const confidence = Math.max(0, Math.min(1, Number(data.confidence_score ?? 0)))
  const level = { safe: 'low', suspicious: 'medium', scam: 'high' }[data.verdict] ?? 'medium'
  const rawRiskScore = Number(data.risk_score)
  const hasRiskScore = data.risk_score !== null && data.risk_score !== undefined && Number.isFinite(rawRiskScore)
  const score = hasRiskScore
    ? Math.round(Math.max(0, Math.min(100, rawRiskScore <= 1 ? rawRiskScore * 100 : rawRiskScore)))
    : Math.round(confidence * 100)
  const signal = {
    normal: 'modelNormal',
    promo: 'modelPromo',
    penipuan: 'modelScam',
  }[data.category] ?? 'modelUnknown'

  return {
    score,
    metric: hasRiskScore ? 'risk' : 'confidence',
    metricLabel: hasRiskScore ? 'Skor risiko' : 'Keyakinan model',
    found: [signal],
    level,
    reportId: data.id,
    confidence: Math.round(confidence * 100),
    category: data.category,
    verdict: data.verdict,
    extractedText: data.extracted_text,
    createdAt: data.created_at,
    source: 'model',
  }
}

export function createDemoResult(value, mode = 'url') {
  return mode === 'image' ? mockImageAnalysis() : mockTextAnalysis(value, mode)
}

export async function detectThreat({ mode, value = '', file = null, accessToken = '' }) {
  if (!IS_API_ENABLED) {
    await new Promise((resolve) => setTimeout(resolve, 950))
    return mode === 'image' ? mockImageAnalysis() : mockTextAnalysis(value, mode)
  }

  if (!accessToken) {
    const error = new Error('Silakan masuk terlebih dahulu untuk menggunakan analisis model.')
    error.status = 401
    throw error
  }

  if (mode === 'image') {
    const body = new FormData()
    body.append('file', file)
    return normalizeModelResult(await apiRequest('/detection/image', {
      method: 'POST',
      body,
      accessToken,
    }))
  }

  const text = mode === 'url' ? `https://${value.replace(/^https?:\/\//i, '')}` : value
  return normalizeModelResult(await apiRequest('/detection/text', {
    method: 'POST',
    body: JSON.stringify({ text }),
    accessToken,
  }))
}
