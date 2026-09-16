import { useEffect, useRef, useState } from 'react'
import { createDemoResult, detectThreat } from './services/detectionService.js'
import { loginUser, registerUser, resendOtp, verifyOtp, getCurrentUser } from './services/authService.js'
import { API_BASE_URL, IS_API_ENABLED, checkApiConnection } from './services/apiClient.js'

const shell = 'mx-auto w-[calc(100%_-_48px)] max-w-[1180px] max-sm:w-[calc(100%_-_30px)]'
const displayTitle = 'font-display font-black uppercase leading-[.9] tracking-[-.065em]'

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
  modelUnknown: ['Model mengembalikan kategori belum dikenal', 'Model'],
}

const LEVELS = {
  high: {
    label: 'Risiko tinggi', color: '#ff5d48', title: 'Ancaman terdeteksi',
    summary: 'Sinyal cocok dengan pola phishing atau spam.',
    recommendation: 'Jangan buka tautan, membalas pesan, atau membagikan informasi pribadi.',
  },
  medium: {
    label: 'Perlu waspada', color: '#ffb84d', title: 'Sinyal mencurigakan',
    summary: 'Beberapa pola perlu diverifikasi lebih lanjut.',
    recommendation: 'Verifikasi melalui kanal resmi sebelum mengambil tindakan.',
  },
  low: {
    label: 'Risiko rendah', color: '#53d99f', title: 'Tidak tampak berbahaya',
    summary: 'Tidak ditemukan pola ancaman utama.',
    recommendation: 'Tetap periksa identitas pengirim dan tujuan tautan sebelum melanjutkan.',
  },
}

function ShieldIcon({ className = 'size-6', plus = false }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 4 34 9v10.5c0 8.5-5.9 14-14 16.8-8.1-2.8-14-8.3-14-16.8V9l14-5Z" />
      {plus ? <path d="M14 20h12M20 14v12" /> : <path d="m13.5 20 4.2 4 8.8-9.5" />}
    </svg>
  )
}

function ArrowIcon({ className = 'size-5' }) {
  return <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
}

function SearchIcon({ className = 'size-5' }) {
  return <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="9" cy="9" r="5.5" /><path d="m13.2 13.2 4 4" /></svg>
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
    <a href="#top" aria-label="Sentry beranda" className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-[-.055em]">
      <span className="grid size-[34px] -rotate-2 place-items-center rounded-[10px_10px_13px_13px] bg-ink text-acid">
        <ShieldIcon className="size-[23px]" />
      </span>
      <span>SENTRY<span className="text-[#72b136]">.</span></span>
    </a>
  )
}

function Eyebrow({ number, children, light = false }) {
  return (
    <div className={`mb-6 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[.16em] ${light ? 'text-[#80908a]' : 'text-[#66736e]'}`}>
      <span className="grid h-[18px] w-7 place-items-center rounded-full border border-current text-[8px]">{number}</span>
      {children}
    </div>
  )
}

function Header({ session, apiStatus, onOpenAuth, onLogout }) {
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const close = () => setOpen(false)
  const statusCopy = {
    checking: ['Memeriksa API', 'bg-warning'],
    online: ['API terhubung', 'bg-safe'],
    offline: ['API offline', 'bg-danger'],
    demo: ['Mode demo', 'bg-warning'],
  }[apiStatus]
  const navLink = "relative py-2 font-semibold tracking-[-.02em] text-[#52605b] transition-colors duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-[#72b136] after:content-[''] after:transition-transform after:duration-300 after:ease-out hover:text-ink hover:after:scale-x-100 focus-visible:text-ink focus-visible:after:scale-x-100"
  const mobileLink = 'border-b border-ink/10 pb-3 transition duration-300 hover:translate-x-1 hover:text-[#5f853f]'
  return (
    <header className="sticky top-0 z-40 w-screen max-w-[100vw] border-b border-ink/15 bg-paper/95 shadow-[0_1px_0_rgba(10,22,19,.03)] backdrop-blur-xl">
      <div className="relative mx-auto flex h-[88px] w-[calc(100vw_-_48px)] max-w-[1280px] items-center justify-between max-sm:h-[74px] max-sm:w-[calc(100vw_-_30px)]">
        <Brand />
        <nav className="flex items-center gap-10 font-display text-[13px] max-[960px]:hidden" aria-label="Navigasi utama">
          <a className={`${navLink} text-ink after:scale-x-100`} href="#scanner">Pemindai</a>
          <a className={navLink} href="#cara-kerja">Cara kerja</a>
          <a className={navLink} href="#wawasan">Wawasan</a>
          <a className={navLink} href="#bantuan">Bantuan</a>
        </nav>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#4e5d58] max-[960px]:hidden">
            <span className={`relative size-[7px] rounded-full ${statusCopy[1]} shadow-[0_0_0_4px_rgba(103,184,66,.13)]`} />
            {statusCopy[0]}
          </div>
          {session.user ? (
            <div className="relative max-[960px]:hidden">
              <button onClick={() => setAccountOpen((value) => !value)} aria-expanded={accountOpen} className="flex h-[42px] items-center gap-2 border border-ink px-[14px] text-xs font-bold transition hover:bg-ink hover:text-white"><span className="grid size-6 place-items-center rounded-full bg-acid text-[9px] text-ink">{session.user.name?.slice(0, 1).toUpperCase()}</span>{session.user.name?.split(' ')[0]}</button>
              {accountOpen && <div className="absolute right-0 top-[50px] w-[245px] border border-ink/10 bg-white p-4 shadow-[0_24px_65px_rgba(5,15,12,.16)]"><span className="block truncate text-[11px] font-bold">{session.user.name}</span><span className="mt-1 block truncate text-[9px] text-[#78847f]">{session.user.email}</span><button onClick={() => { setAccountOpen(false); onLogout() }} className="mt-4 w-full border-t border-ink/10 pt-3 text-left text-[10px] font-bold text-danger">Keluar dari sesi</button></div>}
            </div>
          ) : (
            <button onClick={() => onOpenAuth('login')} className="grid h-[42px] place-items-center border border-ink px-5 text-[11px] font-extrabold tracking-[-.01em] transition duration-300 hover:-translate-y-px hover:bg-ink hover:text-white max-[960px]:hidden">Masuk</button>
          )}
          <button onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? 'Tutup menu' : 'Buka menu'} className="mobile-menu-toggle hidden size-[42px] place-content-center gap-1.5 border border-ink/15 bg-transparent max-[960px]:grid">
            <span className={`block h-px w-[18px] bg-ink transition ${open ? 'translate-y-[3.5px] rotate-45' : ''}`} />
            <span className={`block h-px w-[18px] bg-ink transition ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
          </button>
        </div>
        <nav className={`absolute right-0 top-[66px] flex w-[230px] flex-col gap-4 rounded-b-2xl border border-ink/15 bg-white p-5 font-display text-[13px] font-semibold shadow-[0_24px_65px_rgba(5,15,12,.16)] transition duration-300 max-[960px]:flex min-[961px]:hidden ${open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`} aria-label="Navigasi seluler">
          <a className={mobileLink} onClick={close} href="#scanner">Pemindai</a><a className={mobileLink} onClick={close} href="#cara-kerja">Cara kerja</a><a className={mobileLink} onClick={close} href="#wawasan">Wawasan</a><a className={mobileLink} onClick={close} href="#bantuan">Bantuan</a>{session.user ? <button onClick={() => { close(); onLogout() }} className="pt-1 text-left text-danger">Keluar · {session.user.name?.split(' ')[0]}</button> : <button onClick={() => { close(); onOpenAuth('login') }} className="pt-1 text-left">Masuk / Daftar</button>}
        </nav>
      </div>
    </header>
  )
}

function AuthModal({ open, initialView, apiStatus, onClose, onAuthenticated }) {
  const [view, setView] = useState(initialView)
  const [form, setForm] = useState({ name: '', email: '', password: '', otpCode: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open) return undefined
    setView(initialView)
    setError('')
    setNotice('')
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, initialView, onClose])

  if (!open) return null

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const changeView = (nextView) => {
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
        setNotice('Kode OTP telah dikirim. Periksa inbox email atau Mailpit Anda.')
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
      await resendOtp(form.email.trim())
      setNotice('OTP baru berhasil dikirim.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'OTP gagal dikirim ulang.')
    } finally {
      setLoading(false)
    }
  }

  const title = view === 'login' ? 'Selamat datang kembali.' : view === 'register' ? 'Buat ruang aman Anda.' : 'Verifikasi identitas.'
  const subtitle = view === 'login' ? 'Masuk untuk menganalisis ancaman dan menyimpan riwayat pemeriksaan.' : view === 'register' ? 'Satu akun untuk hasil model dan riwayat yang terpisah secara aman.' : `Masukkan kode OTP yang dikirim ke ${form.email}.`

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-forest/75 p-5 backdrop-blur-md" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="relative grid w-full max-w-[860px] grid-cols-[.82fr_1.18fr] overflow-hidden rounded-[28px] bg-paper shadow-[0_35px_100px_rgba(0,0,0,.35)] max-[760px]:max-w-[510px] max-[760px]:grid-cols-1">
        <div className="relative overflow-hidden bg-ink p-10 text-white max-[760px]:hidden">
          <ResultBackdrop />
          <div className="relative z-10 flex h-full min-h-[500px] flex-col">
            <Brand />
            <div className="my-auto"><span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-acid">Protected workspace</span><h2 className={`${displayTitle} mt-4 text-[42px]`}>Analisis privat.<br />Riwayat personal.</h2><p className="mt-5 max-w-[290px] text-xs leading-[1.8] text-[#91a09a]">Token akses hanya dipakai untuk berkomunikasi dengan backend Anda dan disimpan selama tab browser ini aktif.</p></div>
            <div className="flex items-center gap-2 border-t border-white/10 pt-5 text-[9px] uppercase tracking-[.1em] text-[#91a09a]"><span className={`size-2 rounded-full ${apiStatus === 'online' ? 'bg-safe' : 'bg-danger'}`} />{apiStatus === 'online' ? `Terhubung · ${API_BASE_URL}` : `Menunggu backend · ${API_BASE_URL}`}</div>
          </div>
        </div>
        <div className="relative p-10 max-sm:p-6">
          <button type="button" onClick={onClose} aria-label="Tutup dialog autentikasi" className="absolute right-5 top-5 grid size-9 place-items-center rounded-full border border-ink/10 text-xl font-light transition hover:bg-ink hover:text-white">×</button>
          <span className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#6f9653]">{view === 'login' ? 'Masuk akun' : view === 'register' ? 'Akun baru' : 'Verifikasi OTP'}</span>
          <h2 id="auth-title" className={`${displayTitle} mb-3 mt-5 pr-10 text-[38px]`}>{title}</h2>
          <p className="mb-7 max-w-[390px] text-xs leading-[1.7] text-[#6c7873]">{subtitle}</p>
          {apiStatus === 'offline' && <div className="mb-5 border-l-[3px] border-warning bg-warning/10 px-4 py-3 text-[10px] leading-relaxed text-[#69501e]">Backend belum dapat dijangkau. Anda tetap dapat mengisi form, tetapi proses baru berhasil setelah FastAPI aktif.</div>}
          {error && <div role="alert" className="mb-5 border-l-[3px] border-danger bg-danger/10 px-4 py-3 text-[10px] leading-relaxed text-[#8e3328]">{error}</div>}
          {notice && <div role="status" className="mb-5 border-l-[3px] border-safe bg-safe/10 px-4 py-3 text-[10px] leading-relaxed text-[#286f50]">{notice}</div>}
          <form onSubmit={submit} className="grid gap-4">
            {view === 'register' && <label className="grid gap-2 text-[9px] font-extrabold uppercase tracking-[.09em]">Nama lengkap<input required autoFocus value={form.name} onChange={update('name')} autoComplete="name" className="h-12 border border-ink/15 bg-white px-4 text-[12px] font-normal normal-case tracking-normal outline-none transition focus:border-[#6f9653] focus:ring-2 focus:ring-[#6f9653]/15" placeholder="Nama Anda" /></label>}
            <label className="grid gap-2 text-[9px] font-extrabold uppercase tracking-[.09em]">Email<input required autoFocus={view === 'login'} type="email" value={form.email} onChange={update('email')} disabled={view === 'verify'} autoComplete="email" className="h-12 border border-ink/15 bg-white px-4 text-[12px] font-normal normal-case tracking-normal outline-none transition focus:border-[#6f9653] focus:ring-2 focus:ring-[#6f9653]/15 disabled:bg-[#e8e8e0]" placeholder="nama@email.com" /></label>
            {view !== 'verify' ? <label className="grid gap-2 text-[9px] font-extrabold uppercase tracking-[.09em]">Kata sandi<input required type="password" minLength="8" value={form.password} onChange={update('password')} autoComplete={view === 'register' ? 'new-password' : 'current-password'} className="h-12 border border-ink/15 bg-white px-4 text-[12px] font-normal normal-case tracking-normal outline-none transition focus:border-[#6f9653] focus:ring-2 focus:ring-[#6f9653]/15" placeholder="Minimal 8 karakter" /></label> : <label className="grid gap-2 text-[9px] font-extrabold uppercase tracking-[.09em]">Kode OTP<input required autoFocus inputMode="numeric" maxLength="10" value={form.otpCode} onChange={update('otpCode')} autoComplete="one-time-code" className="h-14 border border-ink/15 bg-white px-4 text-center text-xl font-black tracking-[.35em] outline-none transition focus:border-[#6f9653] focus:ring-2 focus:ring-[#6f9653]/15" placeholder="••••••" /></label>}
            <button disabled={loading} className="mt-2 flex h-13 items-center justify-center gap-3 bg-ink text-[11px] font-extrabold text-white transition hover:-translate-y-px hover:bg-[#1b302a] disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><i className="spin size-3 rounded-full border-2 border-white/30 border-t-acid" />Memproses...</> : view === 'login' ? 'Masuk dan mulai pindai' : view === 'register' ? 'Daftar dan kirim OTP' : 'Verifikasi dan masuk'}</button>
          </form>
          <div className="mt-6 flex items-center justify-between gap-4 text-[10px] text-[#6c7873]">{view === 'verify' ? <><button type="button" onClick={() => changeView('register')} className="font-bold text-ink">Ubah data</button><button type="button" disabled={loading} onClick={handleResend} className="font-bold text-[#638849]">Kirim ulang OTP</button></> : <><span>{view === 'login' ? 'Belum memiliki akun?' : 'Sudah memiliki akun?'}</span><button type="button" onClick={() => changeView(view === 'login' ? 'register' : 'login')} className="font-extrabold text-[#638849]">{view === 'login' ? 'Daftar sekarang' : 'Masuk di sini'}</button></>}</div>
        </div>
      </section>
    </div>
  )
}

function Radar() {
  const node = 'radar-node absolute z-20 flex items-center gap-2 border border-acid/15 bg-[#0b1915]/90 px-3 py-2 text-[9px] uppercase tracking-[.07em] text-[#c9d3ce] shadow-[0_8px_25px_rgba(0,0,0,.18)] backdrop-blur-md'
  return (
    <div className="radar-shell hero-enter-late relative isolate grid aspect-square place-items-center max-[960px]:mx-auto max-[960px]:w-full max-sm:w-[108%] max-sm:-translate-x-[4%]" aria-hidden="true">
      <div className="absolute inset-[1%] -z-30 rounded-full bg-ink shadow-[0_30px_80px_rgba(5,15,12,.15)]" />
      <div className="radar-halo absolute inset-[1%] -z-20 rounded-full" />
      <div className="radar-ring radar-ring-outer absolute inset-[4%] -z-10 rounded-full border border-acid/15" />
      <div className="radar-grid absolute inset-[8%] overflow-hidden rounded-full after:absolute after:left-1/2 after:h-full after:w-px after:bg-acid/15 before:absolute before:top-1/2 before:h-px before:w-full before:bg-acid/15" />
      <div className="radar-ring radar-ring-middle absolute inset-[20%] -z-10 rounded-full border border-acid/15" />
      <div className="radar-ring radar-ring-inner absolute inset-[34%] -z-10 rounded-full border border-acid/15" />
      <div className="radar-sweep absolute inset-[8%] z-0 rounded-full mix-blend-screen" />

      <span className="radar-blip radar-blip-one absolute left-[27%] top-[31%] z-10" />
      <span className="radar-blip radar-blip-two absolute bottom-[25%] left-[31%] z-10" />
      <span className="radar-blip radar-blip-three absolute right-[25%] top-[34%] z-10" />
      <span className="radar-blip radar-blip-four absolute bottom-[29%] right-[31%] z-10" />
      <span className="radar-target absolute right-[21%] top-[47%] z-10"><i /></span>

      <div className="radar-core relative z-10 grid size-28 place-items-center rounded-full bg-acid text-ink shadow-[0_0_0_11px_rgba(201,255,88,.1),0_0_40px_rgba(201,255,88,.25)] max-sm:size-[84px]">
        <ShieldIcon className="size-[58px] max-sm:size-11" />
      </div>
      <div className={`${node} radar-node-one left-[6%] top-[28%] max-sm:p-2`}><span className="radar-node-dot size-1.5 rounded-full bg-safe shadow-[0_0_10px_#53d99f]" /><small className="max-sm:hidden">Sinyal aman</small></div>
      <div className={`${node} radar-node-two right-[-2%] top-[47%] border-danger/25 max-sm:right-[5%] max-sm:p-2`}><span className="radar-node-dot size-1.5 rounded-full bg-danger shadow-[0_0_10px_#ff5d48]" /><small className="max-sm:hidden">Anomali diblokir</small></div>
      <div className={`${node} radar-node-three bottom-[20%] left-[13%] max-sm:p-2`}><span className="radar-node-dot size-1.5 rounded-full bg-safe shadow-[0_0_10px_#53d99f]" /><small className="max-sm:hidden">Domain valid</small></div>
      <div className="absolute bottom-[8%] left-1/2 z-20 flex -translate-x-1/2 items-center whitespace-nowrap text-[8px] uppercase tracking-[.12em] text-[#71817b]"><span className="radar-live-dot mr-2 size-1.5 rounded-full bg-acid" /><span className="mr-2 font-extrabold text-acid">LIVE</span>Pemantauan perimeter digital</div>
    </div>
  )
}

function Hero() {
  return (
    <section className={`${shell} grid min-h-[720px] grid-cols-[1.08fr_.92fr] items-center gap-[65px] py-[78px] pb-[90px] max-[960px]:grid-cols-1 max-[960px]:pt-[70px] max-sm:min-h-0 max-sm:gap-16 max-sm:py-[58px] max-sm:pb-[70px]`} aria-labelledby="hero-title">
      <div className="hero-enter min-w-0 max-[960px]:max-w-[700px]">
        <Eyebrow number="01">Digital threat intelligence</Eyebrow>
        <h1 id="hero-title" className={`${displayTitle} text-[clamp(62px,7vw,100px)] max-sm:text-[clamp(44px,13vw,56px)]`}>Jangan klik<br /><span className="font-normal text-transparent [-webkit-text-stroke:1.5px_#0a1613]">sebelum yakin.</span></h1>
        <p className="my-[34px] max-w-[570px] text-[17px] leading-[1.75] text-[#55625e] max-sm:text-[15px]">Bedah URL, pesan, dan screenshot mencurigakan dalam hitungan detik. Sentry membaca pola, konteks, dan bahasa manipulatif sebelum ancaman menjangkau Anda.</p>
        <div className="flex items-center gap-9 max-sm:flex-col max-sm:items-start max-sm:gap-6">
          <a href="#scanner" className="inline-flex min-h-[52px] items-center justify-center gap-[18px] bg-ink px-[22px] text-[13px] font-bold text-white shadow-[8px_8px_0_#c9ff58] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#c9ff58] max-sm:w-[calc(100%_-_8px)]">Periksa ancaman <ArrowIcon /></a>
          <a href="#cara-kerja" className="group inline-flex items-center gap-2 border-b border-ink py-2 text-[13px] font-bold">Lihat cara kerja <span className="transition group-hover:translate-x-1 group-hover:translate-y-0.5">↘</span></a>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-5 border-t border-ink/15 pt-6 max-sm:mt-12 max-sm:gap-2" aria-label="Statistik sistem">
          {[['03', 'Jenis input'], ['JWT', 'Sesi terlindungi'], ['API', 'FastAPI backend']].map(([value, label]) => <div className="grid gap-1.5" key={label}><strong className="text-xl tracking-[-.04em] max-sm:text-[17px]">{value}</strong><span className="text-[10px] font-bold uppercase tracking-[.1em] text-[#71807a] max-sm:text-[8px]">{label}</span></div>)}
        </div>
      </div>
      <Radar />
    </section>
  )
}

function ResultPanel({ result, onReset, loading, mode, scanPhase, onCopy }) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => setDetailsOpen(false), [result?.reportId])

  if (loading) return <ScanningPanel mode={mode} phase={scanPhase} />

  if (!result) {
    return (
      <aside id="result-card" aria-live="polite" className="relative min-h-[485px] overflow-hidden rounded-3xl bg-ink text-white shadow-[0_30px_80px_rgba(5,15,12,.15)] max-[960px]:min-h-[470px]">
        <ResultBackdrop />
        <div className="relative z-10 flex min-h-full flex-col items-start justify-center p-12 max-sm:p-9">
          <div className="mb-7 grid size-[76px] place-items-center rounded-full border border-acid/35 bg-acid/[.06] text-acid"><ShieldIcon className="size-10" plus /></div>
          <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#92a09a]">Langkah 03 · Hasil</p>
          <h3 className={`${displayTitle} my-2.5 text-[31px] leading-[1.05]`}>Hasil akan muncul<br />di sini.</h3>
          <p className="max-w-[310px] text-xs leading-relaxed text-[#85918d]">Pilih sumber di sebelah kiri, masukkan bukti, lalu tekan tombol analisis.</p>
          <div className="mt-7 grid w-full grid-cols-3 gap-2 text-center text-[8px] font-bold uppercase tracking-[.08em] text-[#82908a]">
            {['Pilih', 'Masukkan', 'Pahami'].map((item, index) => <div className="border border-white/10 px-2 py-3" key={item}><span className="mb-1 block text-acid">0{index + 1}</span>{item}</div>)}
          </div>
        </div>
      </aside>
    )
  }

  const config = LEVELS[result.level] ?? LEVELS.medium
  return (
    <aside id="result-card" aria-live="polite" className="relative min-h-[485px] overflow-hidden rounded-3xl bg-ink text-white shadow-[0_30px_80px_rgba(5,15,12,.15)]">
      <ResultBackdrop />
      <div className="relative z-10 p-[30px] max-sm:p-5">
        <div className="flex items-center justify-between"><span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#92a09a]">Laporan #{result.reportId}</span><span className="rounded-full px-2.5 py-2 text-[8px] font-black uppercase tracking-[.09em]" style={{ background: config.color }}>{config.label}</span></div>
        <div className="my-6 grid grid-cols-[105px_1fr] items-center gap-5 max-sm:grid-cols-[89px_1fr] max-sm:gap-4">
          <div className="relative grid size-[105px] place-items-center rounded-full before:absolute before:inset-2 before:rounded-full before:bg-ink max-sm:size-[89px]" style={{ background: `conic-gradient(${config.color} 0deg ${result.score * 3.6}deg, #27342f ${result.score * 3.6}deg 360deg)` }}><div className="relative flex items-baseline"><strong className="text-3xl tracking-[-.06em] max-sm:text-[26px]">{result.score}</strong><small className="text-[9px] text-[#83908a]">/100</small></div></div>
          <div><span className="text-[8px] font-extrabold tracking-[.13em] text-[#78857f]">SKOR RISIKO</span><h3 className={`${displayTitle} my-1 text-[25px]`}>{config.title}</h3><p className="text-[10px] leading-relaxed text-[#8e9b95]">{config.summary}</p></div>
        </div>
        <div className="border-t border-white/10">
          {result.found.slice(0, 4).map((key) => { const [label, type] = SIGNALS[key] ?? [String(key), 'Model']; const safe = key === 'secure' || key === 'modelNormal'; return <div key={key} className="grid min-h-[42px] grid-cols-[20px_1fr_auto] items-center gap-2 border-b border-white/[.08] text-[10px]"><i className={`grid size-[17px] place-items-center rounded-full text-[9px] not-italic ${safe ? 'bg-safe/10 text-safe' : 'bg-danger/10 text-danger'}`}>{safe ? '✓' : '!'}</i><span>{label}</span><small className="text-[8px] uppercase tracking-[.08em] text-[#7f8c86]">{type}</small></div> })}
        </div>
        {result.source === 'model' && <div className="mt-3 flex items-center justify-between border border-white/[.08] px-3 py-2 text-[8px] uppercase tracking-[.08em] text-[#7f8c86]"><span>Keyakinan model</span><strong className="text-white">{result.confidence}% · {result.category ?? 'unknown'}</strong></div>}
        <div className="mt-4 grid grid-cols-[25px_1fr] gap-2.5 bg-white/[.055] p-3"><span className="grid size-[22px] place-items-center rounded-full bg-acid text-[11px] font-black text-ink">!</span><p className="m-0 text-[9px] leading-relaxed text-[#aeb8b3]"><strong className="text-white">Saran Sentry</strong><br />{config.recommendation}</p></div>
        <button onClick={() => setDetailsOpen((value) => !value)} aria-expanded={detailsOpen} className="mt-3 flex w-full items-center justify-between border-y border-white/[.08] py-3 text-left text-[9px] font-bold text-[#aeb8b3]"><span>Apa arti skor ini?</span><span className={`text-acid transition ${detailsOpen ? 'rotate-45' : ''}`}>+</span></button>
        <div className={`grid transition-all duration-300 ${detailsOpen ? 'grid-rows-[1fr] pt-3 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}><div className="overflow-hidden"><div className="relative h-1.5 rounded-full bg-[linear-gradient(90deg,#53d99f_0_34%,#ffb84d_34%_65%,#ff5d48_65%)]"><span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink" style={{ left: `${result.score}%` }} /></div><div className="mt-2 flex justify-between text-[7px] uppercase tracking-[.08em] text-[#718079]"><span>0 Aman</span><span>35 Waspada</span><span>65 Berisiko</span><span>100</span></div></div></div>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2"><button onClick={onReset} className="flex min-h-10 items-center justify-between bg-acid px-3 text-[10px] font-extrabold text-ink">Periksa ancaman lain <span>↗</span></button><button onClick={onCopy} aria-label="Salin ringkasan hasil" className="grid size-10 place-items-center border border-white/15 text-[#aeb8b3] transition hover:border-acid hover:text-acid"><svg viewBox="0 0 20 20" className="size-4 fill-none stroke-current stroke-[1.5]"><rect x="6" y="6" width="10" height="10" rx="1" /><path d="M4 13H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1" /></svg></button></div>
      </div>
    </aside>
  )
}

function ScanningPanel({ mode, phase }) {
  const phaseCopy = mode === 'image'
    ? ['Mengamankan gambar', 'Membaca teks & elemen visual', 'Menyusun skor risiko']
    : ['Mengamankan input', 'Mencocokkan pola ancaman', 'Menyusun skor risiko']

  return (
    <aside id="result-card" aria-live="polite" className="relative min-h-[485px] overflow-hidden rounded-3xl bg-ink text-white shadow-[0_30px_80px_rgba(5,15,12,.15)]">
      <ResultBackdrop />
      <div className="absolute inset-x-0 top-0 h-px overflow-hidden bg-white/10"><span className="scan-line block h-full w-1/3 bg-acid shadow-[0_0_18px_#c9ff58]" /></div>
      <div className="relative z-10 flex min-h-[485px] flex-col justify-center p-12 max-sm:p-9">
        <div className="relative mb-8 grid size-24 place-items-center rounded-full border border-acid/25 bg-acid/[.04] text-acid"><span className="absolute inset-2 rounded-full border border-dashed border-acid/30 motion-safe:animate-spin [animation-duration:5s]" /><SearchIcon className="size-9" /></div>
        <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#92a09a]">Analisis sedang berjalan</p>
        <h3 className={`${displayTitle} my-3 text-[31px] leading-[1.05]`}>{phaseCopy[phase]}</h3>
        <p className="max-w-[330px] text-xs leading-relaxed text-[#85918d]">Jangan tutup halaman. Sentry sedang memeriksa beberapa lapisan sinyal keamanan.</p>
        <div className="mt-8 grid gap-3">{phaseCopy.map((label, index) => <div key={label} className={`flex items-center gap-3 text-[9px] font-bold uppercase tracking-[.08em] transition ${index <= phase ? 'text-white' : 'text-[#53605b]'}`}><span className={`grid size-5 place-items-center rounded-full border ${index < phase ? 'border-safe bg-safe text-ink' : index === phase ? 'border-acid text-acid' : 'border-white/10'}`}>{index < phase ? '✓' : index + 1}</span>{label}</div>)}</div>
      </div>
    </aside>
  )
}

function ResultBackdrop() {
  return <><div className="absolute -right-40 -top-32 size-[280px] rounded-full border border-acid/15" /><div className="absolute -right-[105px] -top-[75px] size-[280px] rounded-full border border-acid/[.06]" /><div className="absolute -right-[50px] -top-5 size-[280px] rounded-full border border-acid/[.04]" /></>
}

function ScanJourney({ currentStep }) {
  const steps = [
    ['Pilih sumber', 'URL, pesan, atau gambar'],
    ['Masukkan bukti', 'Tempel atau unggah konten'],
    ['Pahami hasil', 'Ikuti saran tindakan'],
  ]
  return (
    <div className="relative mb-[18px] grid grid-cols-3 gap-2 rounded-[20px] border border-ink/10 bg-white/55 p-2 backdrop-blur max-sm:grid-cols-1" aria-label={`Langkah ${currentStep} dari 3`}>
      {steps.map(([title, text], index) => {
        const number = index + 1
        const active = currentStep === number
        const done = currentStep > number
        return <div key={title} className={`relative flex items-center gap-3 rounded-[14px] px-4 py-3 transition ${active ? 'bg-ink text-white shadow-[0_10px_25px_rgba(10,22,19,.14)]' : 'text-[#6c7873]'}`}><span className={`grid size-7 shrink-0 place-items-center rounded-full border text-[9px] font-black ${active ? 'border-acid bg-acid text-ink' : done ? 'border-[#6aa64b] bg-[#6aa64b] text-white' : 'border-ink/15 bg-white'}`}>{done ? '✓' : `0${number}`}</span><span><strong className={`block text-[10px] uppercase tracking-[.08em] ${active ? 'text-white' : 'text-ink'}`}>{title}</strong><small className={`mt-0.5 block text-[9px] ${active ? 'text-[#94a29c]' : 'text-[#89938f]'}`}>{text}</small></span></div>
      })}
    </div>
  )
}

function Scanner({ session, apiStatus, onAuthRequired, onSessionExpired }) {
  const demoMode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('demo') : null
  const isImageDemo = demoMode?.startsWith('image')
  const [mode, setMode] = useState(isImageDemo ? 'image' : 'url')
  const [url, setUrl] = useState(demoMode === 'threat' ? SAMPLE.url : '')
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [scanPhase, setScanPhase] = useState(0)
  const [result, setResult] = useState(() => demoMode === 'threat' ? createDemoResult(SAMPLE.url, 'url') : demoMode === 'image-result' ? createDemoResult('', 'image') : null)
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const urlRef = useRef(null)
  const messageRef = useRef(null)
  const fileRef = useRef(null)

  const notify = (text) => {
    setToast(text)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }
  const changeMode = (nextMode) => {
    setMode(nextMode)
    setResult(null)
    if (nextMode !== 'image') setTimeout(() => (nextMode === 'url' ? urlRef.current : messageRef.current)?.focus(), 30)
  }
  const handleImage = (file) => {
    if (!file) return
    const isBuiltInSample = file.name === 'demo-phishing.svg'
    if (!isBuiltInSample && !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      notify('Gunakan gambar PNG, JPG, atau WebP.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      notify('Ukuran screenshot maksimal 8 MB.')
      return
    }
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
  }
  const clearImage = () => {
    setImageFile(null)
    setPreviewUrl('')
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }
  const useSample = async () => {
    setResult(null)
    if (mode === 'url') setUrl(SAMPLE.url)
    if (mode === 'message') setMessage(SAMPLE.message)
    if (mode === 'image') {
      const response = await fetch('/demo-phishing.svg')
      const blob = await response.blob()
      handleImage(new File([blob], 'demo-phishing.svg', { type: blob.type }))
    }
    notify('Contoh dimuat — siap dianalisis.')
  }
  const scan = async () => {
    const value = (mode === 'url' ? url : message).trim()
    if (mode === 'image' && !imageFile) {
      fileRef.current?.click()
      notify('Pilih screenshot terlebih dahulu.')
      return
    }
    if (mode !== 'image' && !value) {
      (mode === 'url' ? urlRef.current : messageRef.current)?.focus()
      notify(mode === 'url' ? 'Masukkan alamat website terlebih dahulu.' : 'Tempel isi pesan terlebih dahulu.')
      return
    }
    if (IS_API_ENABLED && !session.accessToken) {
      notify('Masuk terlebih dahulu agar hasil dapat dianalisis dan disimpan.')
      onAuthRequired()
      return
    }
    setLoading(true)
    setScanPhase(0)
    const phaseTimer = setInterval(() => setScanPhase((phase) => Math.min(phase + 1, 2)), 310)
    try {
      setResult(await detectThreat({ mode, value, file: imageFile, accessToken: session.accessToken }))
      if (window.innerWidth < 960) requestAnimationFrame(() => document.querySelector('#result-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) onSessionExpired()
      notify(error instanceof Error ? error.message : 'Analisis gagal. Coba kembali.')
    } finally {
      clearInterval(phaseTimer)
      setLoading(false)
    }
  }

  const copySummary = async () => {
    if (!result) return
    const config = LEVELS[result.level] ?? LEVELS.medium
    const findings = result.found.map((key) => (SIGNALS[key] ?? [String(key)])[0]).join(', ')
    try {
      await navigator.clipboard.writeText(`Sentry — ${config.label} (${result.score}/100)\nTemuan: ${findings}\nSaran: ${config.recommendation}`)
      notify('Ringkasan hasil berhasil disalin.')
    } catch {
      notify('Ringkasan tidak dapat disalin di browser ini.')
    }
  }

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])
  useEffect(() => {
    if (isImageDemo && !imageFile) {
      useSample().then(() => {
        if (demoMode === 'image-result') setResult(createDemoResult('', 'image'))
      })
    }
  }, [])

  const hasEvidence = mode === 'url' ? Boolean(url.trim()) : mode === 'message' ? Boolean(message.trim()) : Boolean(imageFile)
  const currentStep = result ? 3 : hasEvidence || loading ? 2 : 1
  const modeHelp = {
    url: ['Tempel alamat website', 'Boleh dengan atau tanpa https://. Jangan buka tautannya terlebih dahulu.'],
    message: ['Tempel seluruh isi pesan', 'Sertakan judul dan isi agar pola bahasa lebih mudah dikenali.'],
    image: ['Unggah screenshot utuh', 'Pastikan alamat, logo, dan isi pesan terlihat jelas di dalam gambar.'],
  }[mode]
  const tabBase = 'flex min-h-[53px] items-center justify-center gap-2.5 rounded-xl text-xs font-bold transition max-sm:text-[10px]'
  return (
    <section id="scanner" className={`${shell} border-t border-ink/15 py-[110px] max-sm:py-[85px]`} aria-labelledby="scanner-title">
      <div className="mb-12 flex items-end justify-between gap-12 max-sm:flex-col max-sm:items-start max-sm:gap-5">
        <div><Eyebrow number="02">Threat scanner</Eyebrow><h2 id="scanner-title" className={`${displayTitle} text-[clamp(45px,5vw,70px)] max-sm:text-[46px]`}>Ada yang terasa janggal?</h2></div>
        <p className="mb-1 max-w-[430px] text-sm leading-[1.7] text-[#69756f]">Periksa tautan, isi pesan, atau screenshot. {IS_API_ENABLED ? 'Hasil dianalisis oleh model backend dan tersimpan di riwayat akun Anda.' : 'Mode demo diproses lokal tanpa mengunggah data.'}</p>
      </div>
      <ScanJourney currentStep={currentStep} />
      <div className="grid grid-cols-[1.15fr_.85fr] items-stretch gap-[18px] max-[960px]:grid-cols-1">
        <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_30px_80px_rgba(5,15,12,.15)]">
          <div className="m-[7px] grid grid-cols-3 rounded-[17px] bg-[#e5e5dc] p-[7px]" role="tablist" aria-label="Jenis analisis">
            <button type="button" role="tab" aria-selected={mode === 'url'} onClick={() => changeMode('url')} className={`${tabBase} ${mode === 'url' ? 'bg-white text-ink shadow-[0_5px_15px_rgba(12,24,20,.08)]' : 'text-[#6e7874]'}`}><LinkIcon className="size-[18px]" /><span><span className="max-sm:hidden">Periksa </span>URL</span></button>
            <button type="button" role="tab" aria-selected={mode === 'message'} onClick={() => changeMode('message')} className={`${tabBase} ${mode === 'message' ? 'bg-white text-ink shadow-[0_5px_15px_rgba(12,24,20,.08)]' : 'text-[#6e7874]'}`}><MailIcon className="size-[18px]" /><span><span className="max-sm:hidden">Analisis </span>Pesan</span></button>
            <button type="button" role="tab" aria-selected={mode === 'image'} onClick={() => changeMode('image')} className={`${tabBase} ${mode === 'image' ? 'bg-white text-ink shadow-[0_5px_15px_rgba(12,24,20,.08)]' : 'text-[#6e7874]'}`}><ImageIcon className="size-[18px]" />Screenshot</button>
          </div>
          <div className="px-[37px] pb-7 pt-6 max-sm:px-5 max-sm:pb-6 max-sm:pt-5">
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-[#f1f3ed] p-3.5"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[9px] font-black text-acid">02</span><div><strong className="block text-[11px] text-ink">{modeHelp[0]}</strong><p className="mt-1 text-[9px] leading-relaxed text-[#74807b]">{modeHelp[1]}</p></div></div>
            <div className="mb-3 flex items-center justify-between"><label htmlFor={mode === 'url' ? 'url-input' : mode === 'message' ? 'message-input' : 'image-input'} className="text-[11px] font-extrabold uppercase tracking-[.09em]">{mode === 'url' ? 'Alamat website' : mode === 'message' ? 'Isi pesan mencurigakan' : 'Screenshot mencurigakan'}</label><button onClick={mode === 'image' && imageFile ? clearImage : useSample} className="border-b border-[#a5ada9] bg-transparent pb-1 text-[10px] font-bold text-[#65716c]">{mode === 'image' && imageFile ? 'Hapus gambar' : 'Gunakan contoh'}</button></div>
            {mode === 'url' ? (
              <div className="flex min-h-[69px] items-center border border-[#c9cdc8] bg-[#f7f7f3] px-4 transition focus-within:border-[#6b8e4f] focus-within:shadow-[0_0_0_3px_rgba(107,142,79,.12)]">
                <span className="text-sm font-bold text-[#789161]">https://</span><input ref={urlRef} id="url-input" value={url} onChange={(event) => { setUrl(event.target.value.replace(/^https?:\/\//i, '')); setResult(null) }} onKeyDown={(event) => event.key === 'Enter' && scan()} className="h-[50px] min-w-0 flex-1 border-0 bg-transparent text-sm outline-0 placeholder:text-[#9ba49f]" placeholder="masukkan-alamat-situs.com" autoComplete="off" spellCheck="false" />
                {url && <button onClick={() => { setUrl(''); setResult(null); urlRef.current?.focus() }} aria-label="Hapus input" className="grid size-[25px] place-items-center rounded-full bg-[#e2e4dd] text-[#59635e]">×</button>}
              </div>
            ) : mode === 'message' ? (
              <div className="relative border border-[#c9cdc8] bg-[#f7f7f3] transition focus-within:border-[#6b8e4f] focus-within:shadow-[0_0_0_3px_rgba(107,142,79,.12)]"><textarea ref={messageRef} id="message-input" value={message} maxLength={2000} onChange={(event) => { setMessage(event.target.value); setResult(null) }} rows="6" className="min-h-[150px] w-full resize-y border-0 bg-transparent p-[18px] pb-10 text-[13px] leading-relaxed outline-0 placeholder:text-[#9ba49f]" placeholder="Tempel isi email, SMS, atau pesan WhatsApp mencurigakan di sini..." /><span className="absolute bottom-3 right-4 text-[9px] text-[#929b96]">{message.length.toLocaleString('id-ID')} / 2.000</span></div>
            ) : (
              <div onDragEnter={(event) => { event.preventDefault(); setDragActive(true) }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragActive(false)} onDrop={(event) => { event.preventDefault(); setDragActive(false); handleImage(event.dataTransfer.files[0]) }} className={`relative min-h-[230px] overflow-hidden border border-dashed bg-[#f7f7f3] transition ${dragActive ? 'border-[#6b8e4f] bg-acid/10 shadow-[0_0_0_3px_rgba(107,142,79,.12)]' : 'border-[#b9c1bc]'}`}>
                <input ref={fileRef} id="image-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleImage(event.target.files?.[0])} className="sr-only" />
                {previewUrl ? <><img src={previewUrl} alt="Preview screenshot yang akan dianalisis" className="h-[230px] w-full object-contain" /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/90 px-4 py-3 text-[9px] text-white backdrop-blur"><span className="max-w-[70%] truncate">{imageFile?.name}</span><span>{(imageFile.size / 1024 / 1024).toFixed(2)} MB</span></div></> : <button type="button" onClick={() => fileRef.current?.click()} className="absolute inset-0 flex w-full flex-col items-center justify-center bg-transparent px-5 text-center"><span className="mb-4 grid size-14 place-items-center rounded-full border border-[#88a371] bg-white text-[#6f9653]"><ImageIcon className="size-6" /></span><strong className="text-sm">Tarik screenshot ke sini</strong><span className="mt-1.5 text-[10px] text-[#7e8984]">atau klik untuk memilih dari perangkat</span></button>}
              </div>
            )}
            <p className="my-3 flex items-center gap-2 text-[10px] text-[#858f89]"><span className="grid size-[15px] shrink-0 place-items-center rounded-full border border-[#a7ada9] font-serif text-[9px]">i</span>{mode === 'image' ? `PNG, JPG, atau WebP — maksimum 8 MB.${IS_API_ENABLED ? ' File akan dikirim ke backend Anda.' : ' Preview tetap lokal.'}` : 'Hindari memasukkan kata sandi atau data pribadi sensitif.'}</p>
            <button disabled={loading} onClick={scan} className="mt-[18px] flex h-[58px] w-full items-center justify-center bg-ink text-xs font-extrabold text-white transition hover:-translate-y-px hover:bg-[#1b302a] disabled:cursor-wait">
              {loading ? <span className="flex items-center gap-3"><i className="spin size-3.5 rounded-full border-2 border-white/30 border-t-acid" />{mode === 'image' ? 'Membaca screenshot...' : 'Membaca sinyal...'}</span> : <span className="flex items-center gap-2.5"><SearchIcon className="size-[17px] text-acid" />{mode === 'image' ? 'Analisis screenshot' : 'Mulai analisis'}</span>}
            </button>
          </div>
          <div className="flex min-h-[52px] items-center justify-between gap-4 border-t border-[#e6e6df] px-[37px] py-2 text-[9px] uppercase tracking-[.06em] text-[#818b86] max-sm:px-5"><span className="flex items-center gap-2 text-[#6f9653]"><ShieldIcon className="size-3.5" /><span className="text-[#818b86]">{IS_API_ENABLED ? session.user ? `Sesi ${session.user.name?.split(' ')[0]}` : 'Login diperlukan' : 'Demo lokal'}</span></span><span className="flex items-center gap-2 max-sm:hidden"><i className={`size-1.5 rounded-full ${apiStatus === 'online' ? 'bg-safe' : apiStatus === 'offline' ? 'bg-danger' : 'bg-warning'}`} />Model <strong className="text-[#56625d]">{IS_API_ENABLED ? apiStatus : 'lokal'}</strong></span></div>
        </div>
        <ResultPanel result={result} loading={loading} mode={mode} scanPhase={scanPhase} onCopy={copySummary} onReset={() => { setResult(null); if (mode !== 'image') (mode === 'url' ? urlRef.current : messageRef.current)?.focus() }} />
      </div>
      <div role="status" aria-live="polite" className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border-l-[3px] border-acid bg-ink px-[18px] py-[13px] text-[11px] text-white shadow-[0_24px_65px_rgba(5,15,12,.2)] transition duration-300 ${toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-20 opacity-0'}`}>{toast}</div>
    </section>
  )
}

const METHODS = [
  { title: 'Jejak digital', text: 'Menilai struktur URL, domain tiruan, pola redirect, dan karakter yang disamarkan.', icon: <><circle cx="14" cy="14" r="10" /><path d="M4 14h20M14 4c3 3 4.5 6.3 4.5 10S17 21 14 24c-3-3-4.5-6.3-4.5-10S11 7 14 4Z" /></> },
  { title: 'Bahasa manipulatif', text: 'Mendeteksi urgensi palsu, hadiah fiktif, ancaman akun, serta permintaan kredensial.', icon: <><path d="M5 7h18v14H5zM8 11h7M8 15h12M8 18h9" /><path d="m19 5 4 4" /></> },
  { title: 'Putusan risiko', text: 'Menggabungkan seluruh sinyal menjadi skor transparan dan saran tindakan yang jelas.', icon: <><path d="M14 3 24 7v7c0 6-4.2 9.5-10 11-5.8-1.5-10-5-10-11V7l10-4Z" /><path d="m9 14 3 3 7-7" /></> },
]

function MethodSection() {
  return (
    <section id="cara-kerja" className={`${shell} grid grid-cols-[.7fr_1.3fr] gap-[100px] border-t border-ink/15 py-[125px] max-[960px]:grid-cols-1 max-[960px]:gap-16 max-sm:py-[85px]`} aria-labelledby="method-title">
      <div className="sticky top-9 self-start max-[960px]:static"><Eyebrow number="03">Di balik layar</Eyebrow><h2 id="method-title" className={`${displayTitle} text-[clamp(45px,5vw,70px)] max-sm:text-[46px]`}>Tiga lapis.<br />Satu keputusan.</h2><p className="my-7 max-w-[360px] text-[13px] leading-[1.75] text-[#68736f]">Setiap input melewati pemeriksaan struktur, konteks bahasa, dan pola ancaman untuk menghasilkan keputusan yang dapat dipahami.</p><a href="#scanner" className="inline-flex items-center gap-2 border-b border-ink py-2 text-[13px] font-bold">Coba pemindai <span>→</span></a></div>
      <div className="border-t border-ink/15">{METHODS.map((item, index) => <article key={item.title} className="grid min-h-[190px] grid-cols-[55px_75px_1fr] items-center gap-6 border-b border-ink/15 transition hover:bg-white/30 hover:px-3.5 max-sm:min-h-[180px] max-sm:grid-cols-[35px_58px_1fr] max-sm:gap-4"><span className="self-start pt-9 text-[9px] font-extrabold text-[#88928e]">0{index + 1}</span><div className="grid size-[67px] place-items-center rounded-full bg-[#e3e3da] max-sm:size-[54px]"><svg className="size-7 fill-none stroke-ink stroke-[1.4]" viewBox="0 0 28 28">{item.icon}</svg></div><div><h3 className={`${displayTitle} mb-2 text-[23px] max-sm:text-xl`}>{item.title}</h3><p className="text-xs leading-relaxed text-[#69756f]">{item.text}</p></div></article>)}</div>
    </section>
  )
}

function Insights() {
  const base = 'group flex min-h-[440px] flex-col overflow-hidden border p-[31px] transition duration-300 hover:-translate-y-2'
  return (
    <section id="wawasan" className="bg-forest py-[120px] text-white max-sm:py-[85px]" aria-labelledby="insight-title"><div className={shell}>
      <div className="mb-12 flex items-end justify-between gap-12 max-sm:flex-col max-sm:items-start max-sm:gap-5"><div><Eyebrow number="04" light>Kenali polanya</Eyebrow><h2 id="insight-title" className={`${displayTitle} text-[clamp(45px,5vw,70px)] max-sm:text-[46px]`}>Ancaman berubah.<br />Prinsip aman tidak.</h2></div><p className="mb-1 max-w-[430px] text-sm leading-[1.7] text-[#80908a]">Tiga kebiasaan sederhana untuk menghentikan sebagian besar serangan rekayasa sosial sebelum terjadi.</p></div>
      <div className="grid grid-cols-3 gap-3.5 max-[960px]:grid-cols-2 max-sm:grid-cols-1">
        <article className={`${base} border-white/[.08] bg-[#111e1a] hover:border-acid/25`}><span className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[#7c8c85]">01 / Periksa</span><h3 className={`${displayTitle} mb-4 mt-[75px] text-[31px] leading-none`}>Lihat sebelum<br />Anda menyentuh.</h3><p className="text-xs leading-[1.7] text-[#87958f]">Periksa ejaan domain dan tujuan tautan. Penyerang mengandalkan kemiripan yang luput dari perhatian.</p><div className="mt-auto flex h-12 items-center gap-2.5 border border-white/10 px-3.5 text-[10px] text-[#aab4b0]"><span className="text-danger">⚠</span><del>paypaI-secure.com</del></div></article>
        <article className={`${base} border-acid bg-acid text-ink`}><span className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[#617d2e]">02 / Berhenti</span><h3 className={`${displayTitle} mb-4 mt-[75px] text-[31px] leading-none`}>Urgensi adalah<br />senjata mereka.</h3><p className="text-xs leading-[1.7] text-[#536735]">Pesan “sekarang juga” sengaja mengurangi waktu berpikir. Berhenti, buka aplikasi resmi, lalu verifikasi.</p><div className="mt-auto flex justify-center gap-3"><span className="h-[76px] w-[25px] rounded bg-ink" /><span className="h-[76px] w-[25px] rounded bg-ink" /></div></article>
        <article className={`${base} border-white/[.08] bg-[#111e1a] hover:border-acid/25 max-[960px]:col-span-2 max-sm:col-span-1`}><span className="text-[9px] font-extrabold uppercase tracking-[.13em] text-[#7c8c85]">03 / Verifikasi</span><h3 className={`${displayTitle} mb-4 mt-[75px] text-[31px] leading-none`}>Gunakan jalur<br />yang Anda percaya.</h3><p className="text-xs leading-[1.7] text-[#87958f]">Hubungi pengirim melalui nomor atau kanal resmi—bukan kontak yang tercantum dalam pesan mencurigakan.</p><div className="mt-auto flex h-12 items-center gap-2.5 border border-white/10 px-3.5 text-[10px] text-[#aab4b0]"><i className="grid size-[21px] place-items-center rounded-full bg-safe text-ink not-italic">✓</i>Identitas terverifikasi</div></article>
      </div>
    </div></section>
  )
}

const FAQS = [
  ['Saya sebaiknya memilih URL, Pesan, atau Screenshot?', 'Pilih URL untuk tautan website, Pesan untuk teks dari email/SMS/chat, dan Screenshot ketika informasi penting seperti logo, tampilan formulir, atau alamat situs hanya tersedia dalam gambar.'],
  ['Apakah screenshot saya aman?', IS_API_ENABLED ? `Preview dibuat di browser, lalu file dikirim hanya ke backend yang dikonfigurasi di ${API_BASE_URL}. Hindari mengunggah data pribadi yang tidak diperlukan.` : 'Pada mode demo, preview dan analisis simulasi berjalan di browser dan file tidak diunggah.'],
  ['Apakah risiko rendah berarti pasti aman?', 'Tidak. Skor rendah berarti sinyal berbahaya utama tidak ditemukan. Tetap verifikasi pengirim dan buka layanan melalui aplikasi atau alamat resmi yang Anda ketik sendiri.'],
  ['Apa yang harus dilakukan jika risikonya tinggi?', 'Jangan klik tautan atau membalas pesan. Tutup halaman, hubungi organisasi melalui kanal resmi, dan segera ganti kredensial jika sebelumnya sudah terlanjur memasukkannya.'],
]

function HelpCenter() {
  const [openIndex, setOpenIndex] = useState(0)
  return (
    <section id="bantuan" className={`${shell} grid grid-cols-[.72fr_1.28fr] gap-[90px] py-[120px] max-[960px]:grid-cols-1 max-[960px]:gap-12 max-sm:py-[85px]`} aria-labelledby="help-title">
      <div><Eyebrow number="05">Pusat bantuan</Eyebrow><h2 id="help-title" className={`${displayTitle} text-[clamp(45px,5vw,70px)] max-sm:text-[46px]`}>Masih bingung?<br />Mulai di sini.</h2><p className="my-7 max-w-[360px] text-[13px] leading-[1.75] text-[#68736f]">Jawaban singkat untuk membantu Anda mengambil keputusan tanpa istilah keamanan yang rumit.</p><a href="#scanner" className="inline-flex min-h-11 items-center gap-3 bg-ink px-4 text-[11px] font-bold text-white transition hover:-translate-y-0.5">Buka pemindai <ArrowIcon className="size-4 text-acid" /></a></div>
      <div className="border-t border-ink/15">{FAQS.map(([question, answer], index) => { const open = openIndex === index; return <article key={question} className="border-b border-ink/15"><button onClick={() => setOpenIndex(open ? -1 : index)} aria-expanded={open} className="grid w-full grid-cols-[36px_1fr_auto] items-center gap-4 py-6 text-left"><span className={`grid size-8 place-items-center rounded-full text-[9px] font-black transition ${open ? 'bg-acid text-ink' : 'bg-[#e1e3da] text-[#6e7974]'}`}>0{index + 1}</span><strong className="text-[13px] leading-relaxed text-ink">{question}</strong><span className={`text-xl font-light transition ${open ? 'rotate-45' : ''}`}>+</span></button><div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] pb-6 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}><div className="overflow-hidden pl-[52px] pr-10 text-xs leading-[1.8] text-[#69756f] max-sm:pl-0 max-sm:pr-4">{answer}</div></div></article> })}</div>
    </section>
  )
}

function Footer() {
  return <footer className="bg-paper pt-[75px]"><div className={`${shell} grid grid-cols-[1fr_1fr_.5fr] gap-20 pb-[70px] max-[960px]:grid-cols-1 max-[960px]:gap-9`}><div><Brand /><p className="mt-5 text-xs leading-relaxed text-[#69756f]">Lapisan tenang di antara Anda<br />dan ancaman digital.</p></div><div><span className="text-[9px] font-extrabold tracking-[.12em] text-[#6e7b76]">MODEL-INTEGRATED UI</span><p className="max-w-[390px] text-[11px] leading-[1.7] text-[#69756f]">Antarmuka terhubung ke FastAPI melalui autentikasi JWT. Hasil model tetap perlu diuji dan divalidasi sebelum dipakai untuk keputusan keamanan dunia nyata.</p></div><div className="flex flex-col gap-3.5 text-[11px] font-bold max-[960px]:flex-row max-[960px]:flex-wrap"><a href="#scanner">Pemindai</a><a href="#cara-kerja">Cara kerja</a><a href="#wawasan">Wawasan</a><a href="#bantuan">Bantuan</a></div></div><div className={`${shell} flex h-[65px] items-center justify-between border-t border-ink/15 text-[9px] uppercase tracking-[.08em] text-[#828d88]`}><span>© 2026 Sentry Labs</span><span className="max-sm:hidden">Dibuat untuk internet yang lebih aman.</span></div></footer>
}

export default function App() {
  const previewAuthView = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('auth') : null
  const initialAuthView = ['login', 'register'].includes(previewAuthView) ? previewAuthView : 'login'
  const [session, setSession] = useState(() => ({
    accessToken: typeof window !== 'undefined' ? sessionStorage.getItem('sentry_access_token') ?? '' : '',
    user: null,
  }))
  const [apiStatus, setApiStatus] = useState(IS_API_ENABLED ? 'checking' : 'demo')
  const [authOpen, setAuthOpen] = useState(['login', 'register'].includes(previewAuthView))
  const [authView, setAuthView] = useState(initialAuthView)

  useEffect(() => {
    let active = true
    if (!IS_API_ENABLED) return undefined

    const initialize = async () => {
      const online = await checkApiConnection()
      if (!active) return
      setApiStatus(online ? 'online' : 'offline')

      if (online && session.accessToken && !session.user) {
        try {
          const user = await getCurrentUser(session.accessToken)
          if (active) setSession((current) => ({ ...current, user }))
        } catch (error) {
          if (error?.status === 401 || error?.status === 403) {
            sessionStorage.removeItem('sentry_access_token')
            if (active) setSession({ accessToken: '', user: null })
          }
        }
      }
    }

    initialize()
    return () => { active = false }
  }, [session.accessToken, session.user])

  const openAuth = (view = 'login') => {
    setAuthView(view)
    setAuthOpen(true)
  }

  const authenticated = ({ accessToken, user }) => {
    sessionStorage.setItem('sentry_access_token', accessToken)
    setSession({ accessToken, user })
    setApiStatus('online')
  }

  const logout = () => {
    sessionStorage.removeItem('sentry_access_token')
    setSession({ accessToken: '', user: null })
  }

  const expireSession = () => {
    logout()
    openAuth('login')
  }

  return (
    <>
      <div className="noise pointer-events-none fixed inset-0 z-50 opacity-[.025]" aria-hidden="true" />
      <Header session={session} apiStatus={apiStatus} onOpenAuth={openAuth} onLogout={logout} />
      <main id="top"><Hero /><Scanner session={session} apiStatus={apiStatus} onAuthRequired={() => openAuth('login')} onSessionExpired={expireSession} /><MethodSection /><Insights /><HelpCenter /></main>
      <Footer />
      <AuthModal open={authOpen} initialView={authView} apiStatus={apiStatus} onClose={() => setAuthOpen(false)} onAuthenticated={authenticated} />
    </>
  )
}
