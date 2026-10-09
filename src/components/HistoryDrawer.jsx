import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteDetection, getDetectionHistory } from '../services/historyService.js'

const VERDICT = {
  safe: { label: 'Risiko rendah', tone: 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' },
  suspicious: { label: 'Mencurigakan', tone: 'bg-amber-950/60 text-amber-300 border border-amber-500/30' },
  scam: { label: 'Berbahaya', tone: 'bg-rose-950/60 text-rose-300 border border-rose-500/30' },
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
      if (requestError?.status === 401 || requestError?.status === 403) onSessionExpired()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[75] bg-black/70 backdrop-blur-md transition-all" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside role="dialog" aria-modal="true" aria-labelledby="history-title" className="absolute right-0 top-0 flex h-full w-full max-w-[540px] flex-col border-l border-white/10 bg-[#070e1c] shadow-[-30px_0_100px_rgba(0,0,0,0.85)]">
        <header className="flex items-start justify-between border-b border-white/10 px-8 py-7 max-sm:px-5">
          <div>
            <div className="eyebrow mb-2">
              <span className="eyebrow-index">LOG</span>
              <span className="eyebrow-text">Aktivitas akun</span>
            </div>
            <h2 id="history-title" className="font-display mt-2 text-[28px] font-bold leading-tight tracking-[-.03em] text-white">Riwayat Pemeriksaan</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Tinjau rekaman ancaman dan hasil analisis sebelumnya.</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Tutup riwayat" className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/5 text-lg text-slate-300 transition hover:bg-white/10 hover:text-white">×</button>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6 max-sm:px-5">
          {error && <div role="alert" className="mb-5 rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-xs leading-relaxed text-rose-200">{error}</div>}
          {loading && !history.length ? (
            <div className="grid min-h-[250px] place-items-center text-xs text-slate-400">
              <span className="flex items-center gap-3 font-mono">
                <i className="spin size-4 rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
                Mengambil log pemeriksaan...
              </span>
            </div>
          ) : null}
          {!loading && !history.length && !error ? (
            <div className="grid min-h-[300px] place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-cyan-950/50 border border-cyan-500/30 text-2xl text-cyan-300">
                  🛡️
                </span>
                <h3 className="font-display mt-5 text-xl font-bold text-white">Belum Ada Riwayat</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">Hasil analisis pertama Anda akan tersimpan secara otomatis di sini.</p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3">
            {history.map((item) => {
              const verdict = VERDICT[item.verdict] ?? VERDICT.suspicious
              const preview = item.input_text || item.extracted_text || 'Konten tidak tersedia'
              const confidence = formatConfidence(item.confidence_score)
              return (
                <article key={item.id} className="rounded-xl border border-white/10 bg-[#0c162c]/80 p-4 transition-all hover:border-cyan-500/40 hover:bg-[#0f1b36]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold ${verdict.tone}`}>
                          ● {verdict.label}
                        </span>
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-sans text-[11px] font-medium text-slate-400">
                          {item.input_type === 'image' ? 'Screenshot' : item.input_type === 'url' ? 'URL' : 'Pesan'}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 break-all font-mono text-xs font-semibold leading-relaxed text-white">
                        {preview}
                      </p>
                      <p className="mt-2 font-sans text-xs text-slate-400">
                        {formatDate(item.created_at)}
                        {confidence !== null ? ` · Keyakinan ${confidence}%` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => removeItem(item.id)}
                      onBlur={() => pendingDelete === item.id && setPendingDelete(null)}
                      className={`shrink-0 rounded-lg px-2.5 py-1.5 font-mono text-[10px] font-bold transition ${
                        pendingDelete === item.id 
                          ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
                          : 'text-rose-400 hover:bg-rose-950/50 hover:text-rose-300'
                      }`}
                    >
                      {pendingDelete === item.id ? 'Konfirmasi hapus?' : 'Hapus'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <footer className="flex min-h-[72px] items-center justify-between border-t border-white/10 bg-[#050b16] px-8 max-sm:px-5">
          <button
            type="button"
            onClick={() => loadHistory(page)}
            disabled={loading}
            className="font-mono text-xs font-bold text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
          >
            Muat ulang
          </button>
          <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
            <button
              type="button"
              aria-label="Halaman sebelumnya"
              onClick={() => loadHistory(page - 1)}
              disabled={loading || page <= 1}
              className="grid size-8 place-items-center rounded-lg border border-white/15 bg-white/5 disabled:opacity-30 hover:border-cyan-400 hover:text-white"
            >
              ←
            </button>
            <span>{page} / {Math.max(totalPages, 1)}</span>
            <button
              type="button"
              aria-label="Halaman berikutnya"
              onClick={() => loadHistory(page + 1)}
              disabled={loading || page >= totalPages}
              className="grid size-8 place-items-center rounded-lg border border-white/15 bg-white/5 disabled:opacity-30 hover:border-cyan-400 hover:text-white"
            >
              →
            </button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
