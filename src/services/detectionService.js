const API_URL = import.meta.env.VITE_DETECTION_API_URL?.trim()

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
    found,
    level: score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low',
    reportId: Math.floor(10000 + Math.random() * 89999),
    source,
  }
}

function normalizeModelResult(data) {
  const score = Math.max(0, Math.min(100, Number(data.score ?? data.risk_score ?? 0)))
  const found = data.found ?? data.signals ?? []
  return {
    score,
    found: found.length ? found : ['secure'],
    level: data.level ?? (score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low'),
    reportId: data.reportId ?? data.report_id ?? Math.floor(10000 + Math.random() * 89999),
    source: 'model',
  }
}

export function createDemoResult(value, mode = 'url') {
  return mode === 'image' ? mockImageAnalysis() : mockTextAnalysis(value, mode)
}

export async function detectThreat({ mode, value = '', file = null }) {
  if (!API_URL) {
    await new Promise((resolve) => setTimeout(resolve, 950))
    return mode === 'image' ? mockImageAnalysis() : mockTextAnalysis(value, mode)
  }

  const options = { method: 'POST' }
  if (mode === 'image') {
    const body = new FormData()
    body.append('mode', mode)
    body.append('image', file)
    options.body = body
  } else {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify({ mode, content: value })
  }

  const response = await fetch(API_URL, options)
  if (!response.ok) throw new Error(`Model API merespons ${response.status}`)
  return normalizeModelResult(await response.json())
}
