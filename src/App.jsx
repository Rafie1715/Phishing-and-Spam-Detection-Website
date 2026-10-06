import { useCallback, useEffect, useRef, useState } from 'react'
import { createDemoResult, detectThreat, MAX_IMAGE_BYTES, MAX_IMAGE_SIZE_MB } from './services/detectionService.js'
import { forgotPassword, getCurrentUser, loginUser, logoutUser, registerUser, resendOtp, resetPassword, verifyOtp } from './services/authService.js'
import { IS_API_ENABLED, checkApiConnection, refreshAccessToken, setAccessTokenListener, invalidateAccessToken } from './services/apiClient.js'
import HistoryDrawer from './components/HistoryDrawer.jsx'
import { useActiveSection } from './hooks/useActiveSection.js'
import { Hero, MethodSection, Insights, HelpCenter, Footer } from './components/EditorialSections.jsx'

const displayTitle = 'font-display font-medium leading-[1.1] tracking-[-.04em]'
const NAV_ITEMS = [
  ['scanner', 'Pemindai'],
  ['cara-kerja', 'Cara kerja'],
  ['wawasan', 'Wawasan'],
  ['bantuan', 'Bantuan'],
]
const NAV_SECTION_IDS = NAV_ITEMS.map(([id]) => id)

const SAMPLE = {
  url: 'secure-bank-verifikasi-login.xyz/account?urgent=true',
  message: 'PERINGATAN: Akun Anda akan diblokir hari ini! Klik tautan berikut dan konfirmasi password serta OTP Anda sekarang untuk menghindari penutupan akun.',
}

const SIGNALS = {
  suspiciousTld: ['Ekstensi domain berisiko', 'Domain'],
  urgency: ['Bahasa mendesak ditemukan', 'Konteks'],
  credentials: ['Permintaan data rahasia', 'Privasi'],
  impersonation: ['Indikasi peniruan merek', 'Identitas'],
  obfuscation: ['Struktur alamat disamarkan', 'URL'],
  shortened: ['Tautan pendek terdeteksi', 'Redirect'],
  visualBrand: ['Logo dan identitas ditiru', 'Visual'],
  visualUrgency: ['Pesan visual bersifat mendesak', 'OCR'],
  visualForm: ['Formulir kredensial terlihat', 'Interface'],
  secure: ['Tidak ada pola berbahaya utama', 'Sinyal'],
  modelNormal: ['Model mengklasifikasikan konten sebagai normal', 'Model'],
  modelPromo: ['Karakteristik promosi atau spam terdeteksi', 'Model'],
  modelScam: ['Karakteristik penipuan terdeteksi', 'Model'],
  modelPhishing: ['Struktur URL menyerupai situs phishing', 'Model'],
  modelLegitimate: ['Struktur URL tidak menunjukkan pola phishing', 'Model'],
  modelUnknown: ['Model mengembalikan kategori belum dikenal', 'Model'],
}

const LEVELS = {
  high: {
    label: 'Risiko tinggi', title: 'Ancaman terdeteksi',
    summary: 'Sinyal cocok dengan pola phishing atau spam.',
    recommendation: 'Jangan buka tautan, membalas pesan, atau membagikan informasi pribadi.',
  },
  medium: {
    label: 'Perlu waspada', title: 'Sinyal mencurigakan',
    summary: 'Beberapa pola perlu diverifikasi lebih lanjut.',
    recommendation: 'Verifikasi melalui kanal resmi sebelum mengambil tindakan.',
  },
  low: {
    label: 'Risiko rendah', title: 'Tidak tampak berbahaya',
    summary: 'Tidak ditemukan pola ancaman utama.',
    recommendation: 'Tetap periksa identitas pengirim dan tujuan tautan sebelum melanjutkan.',
  },
}

function LinkIcon({ className = 'size-5' }) {
  return <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M8.2 11.8 11.8 8M6.3 13.7l-1.1 1.1a3 3 0 0 1-4.2-4.2l3-3a3 3 0 0 1 4.2 0M13.7 6.3l1.1-1.1A3 3 0 1 1 19 9.4l-3 3a3 3 0 0 1-4.2 0" /></svg>
}

function MailIcon({ className = 'size-5' }) {
  return <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="m3 6 7 5 7-5" /></svg>
}

function ImageIcon({ className = 'size-5' }) {
  return <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="3" width="15" height="14" rx="1.5" /><circle cx="7" cy="7.5" r="1.5" /><path d="m4 15 4-4 2.5 2.5 2-2L16 15" /></svg>
}

function Brand() {
  return (
    <a href="#top" aria-label="Sentry beranda" className="brand">
      <svg viewBox="0 0 32 36" fill="none" aria-hidden="true"><path d="M16 2 29 7v10c0 8-6 13-13 17C9 30 3 25 3 17V7Z" stroke="currentColor" strokeWidth="2"/><path d="m10 17 4 4 8-9" stroke="currentColor" strokeWidth="2"/></svg>
      <span>sentry<span className="brand-registered">®</span></span>
    </a>
  )
}

function Header({ session, onOpenAuth, onOpenHistory, onLogout }) {
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const activeSection = useActiveSection(NAV_SECTION_IDS)
  const headerRef = useRef(null)

  useEffect(() => {
    const dismiss = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'pointerdown' && headerRef.current?.contains(event.target)) return
      setOpen(false)
      setAccountOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', dismiss)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', dismiss)
    }
  }, [])

  return (
    <header ref={headerRef} className="site-header">
      <a className="skip-link" href="#scanner">Langsung ke pemindai</a>
      <div className="site-shell header-inner">
        <Brand />
        <span className="brand-description">Periksa dahulu.<br />Klik kemudian.</span>
        <nav className="desktop-nav" aria-label="Navigasi utama">
          {NAV_ITEMS.map(([id, label]) => <a key={id} aria-current={activeSection === id ? 'location' : undefined} href={'#' + id}>{label}</a>)}
        </nav>
        <div className="header-actions">
          {session.user ? <div className="account-container"><button className="account-button" onClick={() => setAccountOpen(!accountOpen)} aria-expanded={accountOpen} aria-controls="account-menu">{session.user.name?.split(' ')[0]} <span aria-hidden="true">⌄</span></button>{accountOpen && <div id="account-menu" className="account-menu"><span>{session.user.email}</span><button onClick={() => { setAccountOpen(false); onOpenHistory() }}>Riwayat pemeriksaan ↗</button><button onClick={() => { setAccountOpen(false); onLogout() }}>Keluar dari akun</button></div>}</div> : <button onClick={() => onOpenAuth('login')} className="account-button">Masuk <span aria-hidden="true">↗</span></button>}
          <button type="button" className="menu-button" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Tutup menu' : 'Buka menu'} onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? '×' : '☰'}</span></button>
        </div>
      </div>
      <nav id="mobile-nav" hidden={!open} className="mobile-nav site-shell" aria-label="Navigasi seluler">{NAV_ITEMS.map(([id, label]) => <a key={id} onClick={() => setOpen(false)} aria-current={activeSection === id ? 'location' : undefined} href={'#' + id}>{label}<span aria-hidden="true">↗</span></a>)}</nav>
    </header>
  )
}

function AuthModal({ open, initialView, apiStatus, onClose, onAuthenticated }) {
  const [view, setView] = useState(initialView)
  const [form, setForm] = useState({ name: '', email: '', password: '', newPassword: '', otpCode: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const modalRef = useRef(null)
  const returnFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    returnFocusRef.current = document.activeElement
    setView(initialView)
    setError('')
    setNotice('')
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => modalRef.current?.querySelector('input, button')?.focus())
    return () => {
      document.body.style.overflow = ''
      setForm((current) => ({ ...current, password: '', newPassword: '', otpCode: '' }))
      returnFocusRef.current?.focus?.()
    }
  }, [open, initialView])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onClose()
      if (event.key !== 'Tab') return
      const focusable = [...modalRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]')]
        .filter(element => element.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, loading, onClose])

  if (!open) return null

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const changeView = (nextView) => {
    if (loading) return
    setView(nextView)
    setError('')
    setNotice('')
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      if (view === 'register') {
        await registerUser({ name: form.name.trim(), email: form.email.trim(), password: form.password })
        setNotice('Kode verifikasi telah dikirim. Periksa kotak masuk atau folder spam email Anda.')
        setView('verify')
        return
      }

      if (view === 'verify') {
        await verifyOtp({ email: form.email.trim(), otpCode: form.otpCode.trim() })
        const token = await loginUser({ email: form.email.trim(), password: form.password })
        const user = await getCurrentUser(token.access_token)
        onAuthenticated({ accessToken: token.access_token, user })
        onClose()
        return
      }

      if (view === 'forgot') {
        await forgotPassword(form.email.trim())
        setNotice('Kode pemulihan telah dikirim. Masukkan kode dan kata sandi baru Anda.')
        setView('reset')
        return
      }

      if (view === 'reset') {
        await resetPassword({ email: form.email.trim(), otpCode: form.otpCode.trim(), newPassword: form.newPassword })
        setForm((current) => ({ ...current, password: '', newPassword: '', otpCode: '' }))
        setNotice('Kata sandi berhasil diperbarui. Silakan masuk kembali.')
        setView('login')
        return
      }

      const token = await loginUser({ email: form.email.trim(), password: form.password })
      const user = await getCurrentUser(token.access_token)
      onAuthenticated({ accessToken: token.access_token, user })
      onClose()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Autentikasi gagal. Coba kembali.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setNotice('')
    setLoading(true)
    try {
      if (view === 'reset') await forgotPassword(form.email.trim())
      else await resendOtp(form.email.trim())
      setNotice('Kode baru berhasil dikirim.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'OTP gagal dikirim ulang.')
    } finally {
      setLoading(false)
    }
  }

  const copy = {
    login: ['Masuk akun', 'Selamat datang kembali.', 'Masuk untuk menganalisis ancaman dan menyimpan riwayat pemeriksaan.'],
    register: ['Akun baru', 'Buat ruang aman Anda.', 'Satu akun untuk hasil analisis dan riwayat pemeriksaan pribadi.'],
    verify: ['Verifikasi akun', 'Verifikasi identitas.', `Masukkan kode yang dikirim ke ${form.email}.`],
    forgot: ['Pemulihan akun', 'Lupa kata sandi?', 'Masukkan email akun Anda. Kami akan mengirim kode pemulihan.'],
    reset: ['Kata sandi baru', 'Amankan kembali akun.', `Masukkan kode yang dikirim ke ${form.email}, lalu buat kata sandi baru.`],
  }[view]
  const showPassword = view === 'login' || view === 'register'
  const showOtp = view === 'verify' || view === 'reset'

  return (
    <div className="auth-overlay fixed inset-0 z-[80] grid place-items-center bg-forest/65 p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <section ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="auth-title" className="auth-dialog relative grid max-h-[calc(100vh_-_40px)] w-full max-w-[860px] grid-cols-[.82fr_1.18fr] overflow-hidden rounded-[3px] bg-paper shadow-[0_35px_100px_rgba(0,0,0,.35)] max-[760px]:max-w-[510px] max-[760px]:grid-cols-1">
        <div className="relative overflow-hidden bg-ink p-10 text-white max-[760px]:hidden">
          <ResultBackdrop />
          <div className="relative z-10 flex h-full min-h-[450px] flex-col">
            <Brand />
            <div className="my-auto"><span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-acid">Ruang pribadi</span><h2 className={`${displayTitle} mt-4 text-[42px]`}>Analisis privat.<br />Riwayat personal.</h2><p className="mt-5 max-w-[290px] text-xs leading-[1.8] text-[#91a09a]">Sesi dapat dipulihkan selama cookie akun masih berlaku. Gunakan tombol Keluar untuk mengakhiri sesi, terutama di perangkat bersama.</p></div>
            <div className="flex items-center gap-2 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[.1em] text-[#91a09a]"><span className={`size-2 rounded-full ${apiStatus === 'online' ? 'bg-safe' : 'bg-danger'}`} />{apiStatus === 'online' ? 'Layanan analisis siap' : 'Layanan analisis belum tersedia'}</div>
          </div>
        </div>
        <div className="relative overflow-y-auto p-10 max-sm:p-6">
          <button type="button" disabled={loading} onClick={onClose} aria-label="Tutup dialog autentikasi" className="absolute right-5 top-5 grid size-9 place-items-center border border-ink/10 text-xl font-light transition hover:bg-ink hover:text-white disabled:opacity-40">×</button>
          <span className="text-[9px] font-extrabold uppercase tracking-[.15em] text-rust">{copy[0]}</span>
          <h2 id="auth-title" className={`${displayTitle} mb-3 mt-5 pr-10 text-[38px]`}>{copy[1]}</h2>
          <p className="mb-7 max-w-[390px] text-xs leading-[1.7] text-[#6c7873]">{copy[2]}</p>
          {apiStatus === 'offline' && <div className="mb-5 border-l-[3px] border-warning bg-warning/10 px-4 py-3 text-xs leading-relaxed text-[#69501e]">Layanan belum dapat dijangkau. Coba kirim kembali setelah koneksi tersedia.</div>}
          {error && <div role="alert" className="mb-5 border-l-[3px] border-danger bg-danger/10 px-4 py-3 text-xs leading-relaxed text-[#8e3328]">{error}</div>}
          {notice && <div role="status" className="mb-5 border-l-[3px] border-safe bg-safe/10 px-4 py-3 text-xs leading-relaxed text-[#286f50]">{notice}</div>}
          <form onSubmit={submit} className="grid gap-4">
            {view === 'register' && <label className="grid gap-2 text-[9px] font-extrabold uppercase tracking-[.09em]">Nama lengkap<input required autoFocus value={form.name} onChange={update('name')} autoComplete="name" className="h-12 border border-ink/15 bg-white px-4 text-[12px] font-normal normal-case tracking-normal outline-none transition focus:border-rust focus:ring-2 focus:ring-rust/15" placeholder="Nama Anda" /></label>}
            <label className="grid gap-2 text-[9px] font-extrabold uppercase tracking-[.09em]">Email<input required autoFocus={view === 'login' || view === 'forgot'} type="email" value={form.email} onChange={update('email')} disabled={showOtp} autoComplete="email" className="h-12 border border-ink/15 bg-white px-4 text-[12px] font-normal normal-case tracking-normal outline-none transition focus:border-rust focus:ring-2 focus:ring-rust/15 disabled:bg-[#e8e8e0]" placeholder="nama@email.com" /></label>
            {showPassword && <label className="grid gap-2 text-[9px] font-extrabold uppercase tracking-[.09em]">Kata sandi<input required type="password" minLength="8" value={form.password} onChange={update('password')} autoComplete={view === 'register' ? 'new-password' : 'current-password'} className="h-12 border border-ink/15 bg-white px-4 text-[12px] font-normal normal-case tracking-normal outline-none transition focus:border-rust focus:ring-2 focus:ring-rust/15" placeholder="Minimal 8 karakter" /></label>}
            {showOtp && <label className="grid gap-2 text-[9px] font-extrabold uppercase tracking-[.09em]">Kode verifikasi<input required autoFocus inputMode="numeric" maxLength="10" value={form.otpCode} onChange={update('otpCode')} autoComplete="one-time-code" className="h-14 border border-ink/15 bg-white px-4 text-center text-xl font-black tracking-[.35em] outline-none transition focus:border-rust focus:ring-2 focus:ring-rust/15" placeholder="••••••" /></label>}
            {view === 'reset' && <label className="grid gap-2 text-[9px] font-extrabold uppercase tracking-[.09em]">Kata sandi baru<input required type="password" minLength="8" value={form.newPassword} onChange={update('newPassword')} autoComplete="new-password" className="h-12 border border-ink/15 bg-white px-4 text-[12px] font-normal normal-case tracking-normal outline-none transition focus:border-rust focus:ring-2 focus:ring-rust/15" placeholder="Minimal 8 karakter" /></label>}
            {view === 'login' && <button type="button" onClick={() => changeView('forgot')} className="-mt-1 justify-self-end text-[10px] font-bold text-rust">Lupa kata sandi?</button>}
            <button disabled={loading} className="mt-2 flex h-13 items-center justify-center gap-3 bg-ink text-[11px] font-extrabold text-white transition hover:-translate-y-px hover:bg-[#1b302a] disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><i className="spin size-3 rounded-full border-2 border-white/30 border-t-acid" />Memproses...</> : view === 'login' ? 'Masuk dan mulai pindai' : view === 'register' ? 'Daftar dan kirim kode' : view === 'verify' ? 'Verifikasi dan masuk' : view === 'forgot' ? 'Kirim kode pemulihan' : 'Simpan kata sandi baru'}</button>
          </form>
          <div className="mt-6 flex items-center justify-between gap-4 text-[10px] text-[#6c7873]">
            {view === 'verify' && <><button type="button" onClick={() => changeView('register')} className="font-bold text-ink">Ubah data</button><button type="button" disabled={loading} onClick={handleResend} className="font-bold text-rust">Kirim ulang kode</button></>}
            {view === 'reset' && <><button type="button" onClick={() => changeView('login')} className="font-bold text-ink">Kembali masuk</button><button type="button" disabled={loading} onClick={handleResend} className="font-bold text-rust">Kirim ulang kode</button></>}
            {view === 'forgot' && <><span>Ingat kata sandi Anda?</span><button type="button" onClick={() => changeView('login')} className="font-extrabold text-rust">Kembali masuk</button></>}
            {(view === 'login' || view === 'register') && <><span>{view === 'login' ? 'Belum memiliki akun?' : 'Sudah memiliki akun?'}</span><button type="button" onClick={() => changeView(view === 'login' ? 'register' : 'login')} className="font-extrabold text-rust">{view === 'login' ? 'Daftar sekarang' : 'Masuk di sini'}</button></>}
          </div>
        </div>
      </section>
    </div>
  )
}

function ResultPanel({ result, onReset, loading, onCopy }) {
  if (loading) return <aside id="result-card" className="result-panel" aria-live="polite" aria-busy="true"><div className="panel-overline"><span>HASIL PEMERIKSAAN</span><span>•••</span></div><div className="result-empty"><div className="inspection-loader" aria-hidden="true" /><h3>Sedang memeriksa.</h3><p>Input Anda sedang diproses. Hasil dan penjelasan akan muncul di sini.</p></div></aside>

  if (!result) return (
    <aside id="result-card" className="result-panel">
      <div className="panel-overline"><span>HASIL PEMERIKSAAN</span><span>MENUNGGU INPUT</span></div>
      <div className="result-empty"><svg className="document-symbol" viewBox="0 0 84 94" fill="none" aria-hidden="true"><path d="M17 7h36l15 15v60H17V7Z" stroke="currentColor" strokeWidth="1.3"/><path d="M53 7v16h15M28 37h28M28 47h20M28 57h13" stroke="currentColor" strokeWidth="1.3"/><circle cx="60" cy="68" r="14" fill="var(--color-panel)" stroke="var(--color-rust)" strokeWidth="1.5"/><path d="m70 79 8 9" stroke="var(--color-rust)" strokeWidth="1.5"/></svg><h3>Bukti dulu.<br />Kesimpulan kemudian.</h3><p>Hasil pemeriksaan akan muncul di sini, beserta petunjuk untuk langkah berikutnya.</p></div>
      <p className="result-footnote">Hasil analisis adalah petunjuk, bukan jaminan keamanan.</p>
    </aside>
  )

  const config = LEVELS[result.level] ?? LEVELS.medium
  return (
    <aside id="result-card" className="result-panel result-filled" aria-live="polite">
      <div className="panel-overline"><span>{result.source === 'demo' ? 'CONTOH SIMULASI' : 'HASIL PEMERIKSAAN'}</span><span>#{result.reportId}</span></div>
      <div className="result-verdict" data-level={result.level}><span className="verdict-label"><span aria-hidden="true">●</span> {config.label}</span><h3>{config.title}</h3><p>{config.summary}</p></div>
      <div className="result-metric"><div><span>{result.metricLabel ?? 'Skor risiko'}</span><strong>{result.score}<small>/100</small></strong></div><div className="metric-track"><span style={{ width: result.score + '%' }} /></div></div>
      <ul className="result-signals">{result.found.map(key => <li key={key}><span aria-hidden="true">↳</span>{(SIGNALS[key] ?? [String(key)])[0]}</li>)}</ul>
      <div className="result-advice"><strong>Langkah berikutnya</strong><p>{config.recommendation}</p></div>
      <details className="result-details"><summary>Apa arti angka ini?</summary><p>{result.metric === 'confidence' ? 'Angka ini menunjukkan keyakinan model terhadap klasifikasi, bukan persentase kemungkinan konten berbahaya.' : result.source === 'demo' ? 'Skor simulasi berasal dari aturan contoh lokal. Angka ini bukan hasil model deteksi Anda.' : 'Skor risiko berasal dari layanan analisis. Gunakan bersama penjelasan dan verifikasi mandiri.'}</p></details>
      {result.extractedText && <details className="result-details"><summary>Teks yang terbaca dari gambar</summary><p className="whitespace-pre-wrap break-words">{result.extractedText}</p></details>}
      <div className="result-actions"><button type="button" onClick={onReset}>Pemeriksaan baru <span aria-hidden="true">↗</span></button><button type="button" onClick={onCopy}>Salin hasil</button></div>
    </aside>
  )
}

function ResultBackdrop() {
  return <div className="auth-rule" aria-hidden="true" />
}

const SCAN_MODES = [
  { id: 'url', label: 'Tautan', Icon: LinkIcon },
  { id: 'message', label: 'Pesan', Icon: MailIcon },
  { id: 'image', label: 'Screenshot', Icon: ImageIcon },
]

function Scanner({ session, apiStatus, onAuthRequired, onSessionExpired, onRetryConnection }) {
  const demoMode = new URLSearchParams(window.location.search).get('demo')
  const [mode, setMode] = useState(demoMode?.startsWith('image') ? 'image' : 'url')
  const [url, setUrl] = useState(demoMode === 'threat' ? SAMPLE.url : '')
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(demoMode?.startsWith('image') ? '/demo-phishing.svg' : '')
  const [sampleActive, setSampleActive] = useState(Boolean(demoMode))
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(() => demoMode === 'threat' ? createDemoResult(SAMPLE.url) : demoMode === 'image-result' ? createDemoResult('', 'image') : null)
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const urlRef = useRef(null)
  const messageRef = useRef(null)
  const fileRef = useRef(null)
  const inFlight = useRef(false)

  useEffect(() => () => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])
  useEffect(() => () => clearTimeout(toastTimer.current), [])
  useEffect(() => {
    if (!result || window.innerWidth > 800) return undefined
    const frame = requestAnimationFrame(() => document.getElementById('result-card')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    }))
    return () => cancelAnimationFrame(frame)
  }, [result])

  const notify = (text) => {
    setToast(text)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3500)
  }
  const changeMode = (next) => {
    if (loading) return
    setMode(next)
    setError('')
    setResult(null)
    setSampleActive(false)
    if (previewUrl === '/demo-phishing.svg') setPreviewUrl('')
  }
  const tabKeyDown = (event, index) => {
    let next
    if (event.key === 'ArrowRight') next = (index + 1) % SCAN_MODES.length
    if (event.key === 'ArrowLeft') next = (index + SCAN_MODES.length - 1) % SCAN_MODES.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = SCAN_MODES.length - 1
    if (next === undefined) return
    event.preventDefault()
    changeMode(SCAN_MODES[next].id)
    document.getElementById('tab-' + SCAN_MODES[next].id)?.focus()
  }
  const edit = (setter, value) => {
    setter(value)
    setResult(null)
    setError('')
    setSampleActive(false)
  }
  const handleImage = (file) => {
    if (!file || loading) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setError('Format belum didukung. Pilih gambar PNG, JPG, atau WebP.')
      return
    }
    if (!file.size || file.size > MAX_IMAGE_BYTES) {
      setError(`Gambar harus berisi data dan berukuran maksimal ${MAX_IMAGE_SIZE_MB} MB.`)
      return
    }
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setSampleActive(false)
    setResult(null)
    setError('')
  }
  const clearImage = () => {
    setImageFile(null)
    setPreviewUrl('')
    setResult(null)
    setSampleActive(false)
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }
  const useSample = () => {
    if (loading) return
    if (mode === 'url') setUrl(SAMPLE.url)
    if (mode === 'message') setMessage(SAMPLE.message)
    if (mode === 'image') {
      setImageFile(null)
      setPreviewUrl('/demo-phishing.svg')
      if (fileRef.current) fileRef.current.value = ''
    }
    setSampleActive(true)
    setError('')
    setResult(createDemoResult(mode === 'url' ? SAMPLE.url : SAMPLE.message, mode))
  }
  const scan = async (event) => {
    event?.preventDefault()
    if (inFlight.current) return
    const value = (mode === 'url' ? url : message).trim()
    setError('')
    if (mode === 'image' ? !previewUrl : !value) {
      setError(mode === 'image' ? 'Pilih screenshot yang ingin diperiksa.' : 'Isi ' + (mode === 'url' ? 'alamat website' : 'pesan') + ' terlebih dahulu.')
      if (mode !== 'image') (mode === 'url' ? urlRef : messageRef).current?.focus()
      return
    }
    if (mode === 'url') {
      try {
        const parsed = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value)
        if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.') || /\s/.test(value)) throw new Error()
      } catch {
        setError('Masukkan alamat website yang lengkap, misalnya contoh.com/halaman.')
        urlRef.current?.focus()
        return
      }
    }
    if (sampleActive) {
      setResult(createDemoResult(value, mode))
      return
    }
    if (IS_API_ENABLED && !session.accessToken) {
      onAuthRequired()
      return
    }
    inFlight.current = true
    setLoading(true)
    setResult(null)
    try {
      setResult(await detectThreat({ mode, value, file: imageFile, accessToken: session.accessToken }))
    } catch (requestError) {
      if (requestError?.status === 401 || requestError?.status === 403) onSessionExpired()
      setError(requestError instanceof Error ? requestError.message : 'Pemeriksaan gagal. Coba kembali.')
    } finally {
      inFlight.current = false
      setLoading(false)
    }
  }
  const copySummary = async () => {
    if (!result) return
    const config = LEVELS[result.level] ?? LEVELS.medium
    try {
      await navigator.clipboard.writeText(
        'Sentry — ' + config.label + (result.source === 'demo' ? ' (contoh simulasi)' : '') +
        '\n' + (result.metricLabel ?? 'Skor risiko') + ': ' + result.score + '/100' +
        '\nTemuan: ' + result.found.map(key => (SIGNALS[key] ?? [String(key)])[0]).join(', ') +
        '\nSaran: ' + config.recommendation
      )
      notify('Ringkasan disalin.')
    } catch { notify('Browser tidak mengizinkan penyalinan. Coba salin teks hasil secara manual.') }
  }
  const helper = {
    url: 'Tempel alamatnya tanpa membuka situs tersebut.',
    message: 'Sertakan isi pesan selengkap mungkin agar konteksnya terbaca.',
    image: 'Pastikan teks pada screenshot terlihat jelas.',
  }[mode]

  return (
    <section id="scanner" className="site-shell scanner-section section-anchor" aria-labelledby="scanner-title">
      <div className="scanner-heading"><div><p className="eyebrow">01 / Meja pemeriksaan</p><h2 id="scanner-title" className="section-title">Apa yang membuat Anda ragu?</h2></div><p>Pilih sumbernya.<br />Kita periksa satu per satu.</p></div>
      <div className="scanner-workspace">
        <div className="input-panel">
          <div className="scan-tabs" role="tablist" aria-label="Jenis pemeriksaan">
            {SCAN_MODES.map(({ id, label, Icon }, i) => <button id={'tab-' + id} key={id} type="button" role="tab" aria-selected={mode === id} aria-controls="scan-input-panel" tabIndex={mode === id ? 0 : -1} disabled={loading} onClick={() => changeMode(id)} onKeyDown={event => tabKeyDown(event, i)}><Icon className="size-[17px]" />{label}<span className="tab-number" aria-hidden="true">0{i + 1}</span></button>)}
          </div>
          <form id="scan-input-panel" role="tabpanel" aria-labelledby={'tab-' + mode} onSubmit={scan} noValidate>
            <fieldset disabled={loading}>
              <div className="input-heading"><label htmlFor={mode + '-input'}>{mode === 'url' ? 'Alamat website' : mode === 'message' ? 'Isi pesan' : 'Screenshot'}</label>{mode !== 'message' && <span className="beta-label">Beta</span>}</div>
              <p id="input-help" className="input-help">{helper}</p>
              {mode === 'url' && <div className="url-field"><LinkIcon className="size-[18px] shrink-0" /><input ref={urlRef} id="url-input" type="text" inputMode="url" value={url} onChange={e => edit(setUrl, e.target.value)} autoComplete="off" spellCheck={false} placeholder="https://alamat-yang-mencurigakan.com" aria-describedby="input-help input-limit" aria-invalid={Boolean(error)} />{url && <button type="button" aria-label="Hapus alamat" onClick={() => { edit(setUrl, ''); urlRef.current?.focus() }}>×</button>}</div>}
              {mode === 'message' && <div className="message-field"><textarea ref={messageRef} id="message-input" value={message} onChange={e => edit(setMessage, e.target.value)} maxLength={2000} rows={5} placeholder="Tempel pesan dari WhatsApp, SMS, atau email di sini…" aria-describedby="input-help" aria-invalid={Boolean(error)} /><span>{message.length.toLocaleString('id-ID')} / 2.000</span></div>}
              {mode === 'image' && <div className="image-field" data-dragging={dragActive} onDragOver={e => { e.preventDefault(); if (!loading) setDragActive(true) }} onDragLeave={() => setDragActive(false)} onDrop={e => { e.preventDefault(); setDragActive(false); handleImage(e.dataTransfer.files[0]) }}>
                <input ref={fileRef} id="image-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => handleImage(e.target.files?.[0])} className="sr-only" />
                {previewUrl ? <div className="image-preview"><img src={previewUrl} alt="Screenshot yang akan diperiksa" onError={() => { setError('Gambar tidak dapat dibaca. Pilih file gambar lain.'); setImageFile(null); setPreviewUrl(''); setSampleActive(false) }} /><div><span>{sampleActive ? 'Contoh screenshot · simulasi' : imageFile?.name}</span><button type="button" onClick={clearImage}>Hapus</button></div></div> : <button type="button" className="upload-button" onClick={() => fileRef.current?.click()}><ImageIcon className="size-7" /><strong>Pilih atau tarik gambar ke sini</strong><span>PNG, JPG, WebP · Maksimal {MAX_IMAGE_SIZE_MB} MB</span></button>}
              </div>}
              <div className="input-meta"><span>{mode === 'image' ? 'Tutupi data pribadi yang tidak diperlukan.' : 'Jangan sertakan kata sandi, PIN, atau OTP.'}</span><button type="button" onClick={useSample}>Coba contoh <span aria-hidden="true">↗</span></button></div>
              <p id="input-limit" className="input-limitation">{mode === 'url' ? 'Beta: pemeriksaan pola teks pada URL. Reputasi domain belum diperiksa.' : mode === 'image' ? 'Beta: pembacaan gambar masih dalam pengembangan.' : 'Pesan diperiksa berdasarkan pola bahasa dan konteksnya.'}</p>
              {sampleActive && <p className="simulation-note" role="status">Contoh simulasi lokal. Hasil ini tidak dikirim atau disimpan ke akun.</p>}
              {error && <p className="scan-error" role="alert">{error}</p>}
              <button type="submit" className="primary-button scan-submit">{loading ? <><span className="spin size-4 rounded-full border-2 border-white/30 border-t-white" />Memeriksa…</> : <><span>{sampleActive || !IS_API_ENABLED ? 'Jalankan simulasi' : 'Periksa ' + (mode === 'url' ? 'tautan' : mode === 'message' ? 'pesan' : 'screenshot')}</span><span aria-hidden="true">↗</span></>}</button>
              <p className="scan-account-note">{sampleActive || !IS_API_ENABLED ? 'Simulasi berjalan di perangkat Anda.' : session.user ? 'Hasil pemeriksaan tersimpan di riwayat Anda.' : <>Masuk diperlukan untuk analisis. <button type="button" onClick={useSample}>Coba simulasi tanpa akun.</button></>}</p>
            </fieldset>
          </form>
          <div className="service-status" role="status"><span><i data-status={apiStatus} />{apiStatus === 'online' ? 'Layanan terhubung' : apiStatus === 'offline' ? 'Layanan belum terhubung' : apiStatus === 'demo' ? 'Mode simulasi lokal' : 'Memeriksa koneksi…'}</span>{apiStatus === 'offline' ? <button type="button" onClick={onRetryConnection} className="font-semibold text-rust underline underline-offset-4">Cek ulang koneksi</button> : <span>URL / TEKS / GAMBAR</span>}</div>
        </div>
        <ResultPanel result={result} loading={loading} onCopy={copySummary} onReset={() => { setResult(null); (mode === 'url' ? urlRef : mode === 'message' ? messageRef : fileRef).current?.focus() }} />
      </div>
      <div className="scanner-caption"><span aria-hidden="true">↳</span><p>Ragu pada hasilnya? Selalu periksa kembali lewat aplikasi atau kontak resmi.</p><a href="#bantuan">Tentang pemeriksaan <span aria-hidden="true">↗</span></a></div>
      {toast && <div role="status" className="toast">{toast}</div>}
    </section>
  )
}

export default function App() {
  const previewAuthView = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('auth') : null
  const authViews = ['login', 'register', 'forgot', 'reset']
  const initialAuthView = authViews.includes(previewAuthView) ? previewAuthView : 'login'
  const [session, setSession] = useState({ accessToken: '', user: null })
  const [apiStatus, setApiStatus] = useState(IS_API_ENABLED ? 'checking' : 'demo')
  const [authOpen, setAuthOpen] = useState(authViews.includes(previewAuthView))
  const [authView, setAuthView] = useState(initialAuthView)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [connectionAttempt, setConnectionAttempt] = useState(0)
  const [accountNotice, setAccountNotice] = useState('')
  const sessionVersion = useRef(0)

  useEffect(() => {
    let active = true
    if (!IS_API_ENABLED) return undefined
    setApiStatus('checking')

    const initialize = async () => {
      const online = await checkApiConnection()
      if (!active) return
      setApiStatus(online ? 'online' : 'offline')
    }

    initialize()
    return () => { active = false }
  }, [connectionAttempt])

  useEffect(() => {
    if (!IS_API_ENABLED) return undefined
    let active = true
    const version = sessionVersion.current
    setAccessTokenListener((accessToken) => {
      if (active) setSession((current) => current.user ? { ...current, accessToken } : current)
    })
    const restoreSession = async () => {
      try {
        const accessToken = await refreshAccessToken()
        if (!active || version !== sessionVersion.current) return
        const user = await getCurrentUser(accessToken)
        if (active && version === sessionVersion.current) setSession({ accessToken, user })
      } catch {
        // Cookie absent or expired: leave the user signed out.
      }
    }
    restoreSession()
    return () => {
      active = false
      setAccessTokenListener(null)
    }
  }, [])

  const openAuth = useCallback((view = 'login') => {
    setHistoryOpen(false)
    setAuthView(view)
    setAuthOpen(true)
  }, [])
  const closeAuth = useCallback(() => setAuthOpen(false), [])
  const openHistory = useCallback(() => setHistoryOpen(true), [])
  const closeHistory = useCallback(() => setHistoryOpen(false), [])

  const authenticated = useCallback(({ accessToken, user }) => {
    sessionVersion.current += 1
    invalidateAccessToken()
    setAccountNotice('')
    setSession({ accessToken, user })
    setApiStatus('online')
  }, [])

  const clearSession = useCallback(() => {
    sessionVersion.current += 1
    invalidateAccessToken()
    setHistoryOpen(false)
    setSession({ accessToken: '', user: null })
  }, [])

  const logout = useCallback(async () => {
    clearSession()
    try {
      await logoutUser()
    } catch {
      setAccountNotice('Anda sudah keluar dari halaman ini, tetapi sesi di server belum dapat diakhiri. Coba keluar lagi setelah koneksi pulih.')
    }
  }, [clearSession])

  const expireSession = useCallback(() => {
    clearSession()
    openAuth('login')
  }, [clearSession, openAuth])

  return (
    <>
      <Header session={session} onOpenAuth={openAuth} onOpenHistory={openHistory} onLogout={logout} />
      {accountNotice && <div role="alert" className="flex flex-wrap items-center justify-center gap-3 border-b border-line bg-paper px-6 py-3 text-xs"><span>{accountNotice}</span><button type="button" className="text-rust underline" onClick={async () => { try { await logoutUser(); setAccountNotice('') } catch { /* Keep the notice available for retry. */ } }}>Coba lagi</button><button type="button" className="text-rust underline" onClick={() => setAccountNotice('')}>Tutup</button></div>}
      <main id="top"><Hero /><Scanner session={session} apiStatus={apiStatus} onAuthRequired={() => openAuth('login')} onSessionExpired={expireSession} onRetryConnection={() => setConnectionAttempt((attempt) => attempt + 1)} /><MethodSection /><Insights /><HelpCenter /></main>
      <Footer />
      <HistoryDrawer open={historyOpen} accessToken={session.accessToken} onClose={closeHistory} onSessionExpired={expireSession} />
      <AuthModal open={authOpen} initialView={authView} apiStatus={apiStatus} onClose={closeAuth} onAuthenticated={authenticated} />
    </>
  )
}
