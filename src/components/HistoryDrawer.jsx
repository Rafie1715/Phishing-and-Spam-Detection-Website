import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteDetection, getDetectionHistory } from '../services/historyService.js'

const VERDICT = {
  safe: { label: 'Aman', tone: 'bg-safe/15 text-[#287153]' },
  suspicious: { label: 'Mencurigakan', tone: 'bg-warning/15 text-[#8a5c12]' },
  scam: { label: 'Berbahaya', tone: 'bg-danger/15 text-[#9b392e]' },
}

function formatDate(value) {
  if (!value) return 'Waktu tidak tersedia'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Waktu tidak tersedia'
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatConfidence(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return null
  return Math.round(number <= 1 ? number * 100 : number)
}

function getItems(response) {
  if (Array.isArray(response)) return response
  return response?.items ?? response?.data ?? []
}

export default function HistoryDrawer({ open, accessToken, onClose, onSessionExpired }) {
  const [history, setHistory] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const closeButtonRef = useRef(null)

  const loadHistory = useCallback(async (nextPage = 1) => {
    setLoading(true)
    setError('')
    try {
      const response = await getDetectionHistory(accessToken, nextPage)
      const items = getItems(response)
      setHistory(items)
      setPage(response?.page ?? nextPage)
      setTotalPages(response?.total_pages ?? response?.pages ?? Math.max(1, Math.ceil((response?.total ?? items.length) / 8)))
    } catch (requestError) {
      if (requestError?.status === 401 || requestError?.status === 403) {
        onSessionExpired()
        return
      }
      setError(requestError instanceof Error ? requestError.message : 'Riwayat gagal dimuat.')
    } finally {
      setLoading(false)
    }
  }, [accessToken, onSessionExpired])

  useEffect(() => {
    if (!open) return undefined
    loadHistory(1)
    closeButtonRef.current?.focus()
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      setPendingDelete(null)
    }
  }, [open, loadHistory, onClose])

  const removeItem = async (id) => {
    if (pendingDelete !== id) {
      setPendingDelete(id)
      return
    }

    setLoading(true)
    setError('')
    try {
      await deleteDetection(accessToken, id)
      setPendingDelete(null)
      await loadHistory(history.length === 1 && page > 1 ? page - 1 : page)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Riwayat gagal dihapus.')
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[75] bg-forest/55 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" aria-labelledby="history-title" className="absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col bg-paper shadow-[-30px_0_90px_rgba(0,0,0,.24)]">
        <header className="flex items-start justify-between border-b border-ink/15 px-7 py-7 max-sm:px-5">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#6f9653]">Aktivitas akun</span>
            <h2 id="history-title" className="font-display mt-2 text-[30px] font-black uppercase tracking-[-.055em]">Riwayat pemeriksaan</h2>
            <p className="mt-2 text-xs leading-relaxed text-[#66736e]">Tinjau hasil terdahulu tanpa mengirim ulang data.</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Tutup riwayat" className="grid size-10 shrink-0 place-items-center rounded-full border border-ink/15 text-xl transition hover:bg-ink hover:text-white">×</button>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6 max-sm:px-5">
          {error && <div role="alert" className="mb-5 border-l-[3px] border-danger bg-danger/10 px-4 py-3 text-xs leading-relaxed text-[#8e3328]">{error}</div>}
          {loading && !history.length ? <div className="grid min-h-[250px] place-items-center text-xs text-[#66736e]"><span className="flex items-center gap-3"><i className="spin size-4 rounded-full border-2 border-ink/20 border-t-ink" />Memuat riwayat...</span></div> : null}
          {!loading && !history.length && !error ? <div className="grid min-h-[300px] place-items-center border border-dashed border-ink/20 bg-white/25 p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e3e4da] text-2xl">⌁</span><h3 className="font-display mt-5 text-lg font-bold">Belum ada pemeriksaan</h3><p className="mt-2 text-xs leading-relaxed text-[#69756f]">Hasil analisis pertama Anda akan muncul di sini.</p></div></div> : null}

          <div className="grid gap-3">
            {history.map((item) => {
              const verdict = VERDICT[item.verdict] ?? VERDICT.suspicious
              const preview = item.input_text || item.extracted_text || 'Konten tidak tersedia'
              const confidence = formatConfidence(item.confidence_score)
              return (
                <article key={item.id} className="border border-ink/12 bg-white/45 p-4 transition hover:border-ink/25 hover:bg-white/70">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.08em] ${verdict.tone}`}>{verdict.label}</span>
                        <span className="text-[9px] font-bold uppercase tracking-[.08em] text-[#7b8681]">{item.input_type === 'image' ? 'Screenshot' : item.input_type === 'url' ? 'URL' : 'Pesan'}</span>
                      </div>
                      <p className="mt-3 line-clamp-2 break-all text-xs font-semibold leading-relaxed text-ink">{preview}</p>
                      <p className="mt-2 text-[10px] text-[#75807b]">{formatDate(item.created_at)}{confidence !== null ? ` · Keyakinan ${confidence}%` : ''}</p>
                    </div>
                    <button type="button" disabled={loading} onClick={() => removeItem(item.id)} onBlur={() => pendingDelete === item.id && setPendingDelete(null)} className={`shrink-0 px-2 py-1.5 text-[10px] font-bold transition ${pendingDelete === item.id ? 'bg-danger text-white' : 'text-danger hover:bg-danger/10'}`}>{pendingDelete === item.id ? 'Konfirmasi hapus' : 'Hapus'}</button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <footer className="flex min-h-[72px] items-center justify-between border-t border-ink/15 px-7 max-sm:px-5">
          <button type="button" onClick={() => loadHistory(page)} disabled={loading} className="text-[11px] font-bold text-[#5f853f] disabled:opacity-50">Muat ulang</button>
          <div className="flex items-center gap-3 text-[10px] font-bold text-[#66736e]">
            <button type="button" aria-label="Halaman sebelumnya" onClick={() => loadHistory(page - 1)} disabled={loading || page <= 1} className="grid size-9 place-items-center border border-ink/15 disabled:opacity-30">←</button>
            <span>{page} / {Math.max(totalPages, 1)}</span>
            <button type="button" aria-label="Halaman berikutnya" onClick={() => loadHistory(page + 1)} disabled={loading || page >= totalPages} className="grid size-9 place-items-center border border-ink/15 disabled:opacity-30">→</button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
