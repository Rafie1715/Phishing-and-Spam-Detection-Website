import { useEffect, useRef, useState } from 'react'
import { createDemoResult, detectThreat } from './services/detectionService.js'

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
    <a href="#top" aria-label="Sentry beranda" className="inline-flex items-center gap-2.5 text-xl font-black tracking-[-.05em]">
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

function Header() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <header className="relative z-20 mx-auto flex h-[88px] w-[calc(100%_-_48px)] max-w-[1280px] items-center justify-between border-b border-ink/15 max-sm:h-[74px] max-sm:w-[calc(100%_-_30px)]">
      <Brand />
      <nav className="flex items-center gap-9 text-[13px] font-semibold text-[#52605b] max-[960px]:hidden" aria-label="Navigasi utama">
        <a className="relative text-ink after:absolute after:-bottom-3 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-[#74ac3f]" href="#scanner">Pemindai</a>
        <a className="transition hover:text-ink" href="#cara-kerja">Cara kerja</a>
        <a className="transition hover:text-ink" href="#wawasan">Wawasan</a>
      </nav>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.1em] text-[#4e5d58] max-[960px]:hidden">
          <span className="relative size-[7px] rounded-full bg-[#67b842] shadow-[0_0_0_4px_rgba(103,184,66,.13)]" />
          Sistem aktif
        </div>
        <a href="#scanner" className="grid h-[42px] place-items-center border border-ink px-[18px] text-xs font-bold transition hover:bg-ink hover:text-white max-[960px]:hidden">Mulai pindai</a>
        <button onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? 'Tutup menu' : 'Buka menu'} className="hidden size-[42px] place-content-center gap-1.5 border border-ink/15 bg-transparent max-[960px]:grid">
          <span className={`block h-px w-[18px] bg-ink transition ${open ? 'translate-y-[3.5px] rotate-45' : ''}`} />
          <span className={`block h-px w-[18px] bg-ink transition ${open ? '-translate-y-[3.5px] -rotate-45' : ''}`} />
        </button>
      </div>
      <nav className={`absolute right-0 top-[75px] flex w-[210px] flex-col gap-[18px] border border-ink/15 bg-white p-5 text-[13px] font-bold shadow-[0_24px_65px_rgba(5,15,12,.16)] transition max-[960px]:flex min-[961px]:hidden ${open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`} aria-label="Navigasi seluler">
        <a onClick={close} href="#scanner">Pemindai</a><a onClick={close} href="#cara-kerja">Cara kerja</a><a onClick={close} href="#wawasan">Wawasan</a>
      </nav>
    </header>
  )
}

function Radar() {
  const node = 'absolute flex items-center gap-2 border border-acid/15 bg-[#0f1d18]/90 px-3 py-2 text-[9px] uppercase tracking-[.07em] text-[#c9d3ce] backdrop-blur-md'
  return (
    <div className="hero-enter-late relative isolate grid aspect-square place-items-center max-[960px]:mx-auto max-[960px]:w-full max-sm:w-[108%] max-sm:-translate-x-[4%]" aria-hidden="true">
      <div className="absolute inset-[1%] -z-30 rounded-full bg-ink shadow-[0_30px_80px_rgba(5,15,12,.15)]" />
      <div className="absolute inset-[4%] -z-10 rounded-full border border-acid/15" />
      <div className="radar-grid absolute inset-[8%] overflow-hidden rounded-full after:absolute after:left-1/2 after:h-full after:w-px after:bg-acid/15 before:absolute before:top-1/2 before:h-px before:w-full before:bg-acid/15" />
      <div className="absolute inset-[20%] -z-10 rounded-full border border-acid/15" />
      <div className="absolute inset-[34%] -z-10 rounded-full border border-acid/15" />
      <div className="radar-sweep absolute left-1/2 top-[7%] h-[43%] w-[43%] rounded-tl-full mix-blend-screen" />
      <div className="relative z-10 grid size-28 place-items-center rounded-full bg-acid text-ink shadow-[0_0_0_11px_rgba(201,255,88,.1),0_0_40px_rgba(201,255,88,.25)] max-sm:size-[84px]">
        <ShieldIcon className="size-[58px] max-sm:size-11" />
      </div>
      <div className={`${node} left-[6%] top-[28%] max-sm:p-2`}><span className="size-1.5 rounded-full bg-safe shadow-[0_0_10px_#53d99f]" /><small className="max-sm:hidden">Sinyal aman</small></div>
      <div className={`${node} right-[-2%] top-[47%] max-sm:right-[5%] max-sm:p-2`}><span className="size-1.5 rounded-full bg-danger shadow-[0_0_10px_#ff5d48]" /><small className="max-sm:hidden">Anomali diblokir</small></div>
      <div className={`${node} bottom-[20%] left-[13%] max-sm:p-2`}><span className="size-1.5 rounded-full bg-safe shadow-[0_0_10px_#53d99f]" /><small className="max-sm:hidden">Domain valid</small></div>
      <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] uppercase tracking-[.12em] text-[#71817b]"><span className="mr-2 font-extrabold text-acid">LIVE</span>Pemantauan perimeter digital</div>
    </div>
  )
}

function Hero() {
  return (
    <section className={`${shell} grid min-h-[720px] grid-cols-[1.08fr_.92fr] items-center gap-[65px] py-[78px] pb-[90px] max-[960px]:grid-cols-1 max-[960px]:pt-[70px] max-sm:min-h-0 max-sm:gap-16 max-sm:py-[58px] max-sm:pb-[70px]`} aria-labelledby="hero-title">
      <div className="hero-enter min-w-0 max-[960px]:max-w-[700px]">
        <Eyebrow number="01">Digital threat intelligence</Eyebrow>
        <h1 id="hero-title" className={`${displayTitle} text-[clamp(62px,7vw,100px)] max-sm:text-[clamp(52px,16vw,75px)]`}>Jangan klik<br /><span className="font-normal text-transparent [-webkit-text-stroke:1.5px_#0a1613]">sebelum yakin.</span></h1>
        <p className="my-[34px] max-w-[570px] text-[17px] leading-[1.75] text-[#55625e] max-sm:text-[15px]">Bedah URL dan pesan mencurigakan dalam hitungan detik. Sentry membaca pola, reputasi, dan bahasa manipulatif sebelum ancaman menjangkau Anda.</p>
        <div className="flex items-center gap-9 max-sm:flex-col max-sm:items-start max-sm:gap-6">
          <a href="#scanner" className="inline-flex min-h-[52px] items-center justify-center gap-[18px] bg-ink px-[22px] text-[13px] font-bold text-white shadow-[8px_8px_0_#c9ff58] transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#c9ff58] max-sm:w-[calc(100%_-_8px)]">Periksa ancaman <ArrowIcon /></a>
          <a href="#cara-kerja" className="group inline-flex items-center gap-2 border-b border-ink py-2 text-[13px] font-bold">Lihat cara kerja <span className="transition group-hover:translate-x-1 group-hover:translate-y-0.5">↘</span></a>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-5 border-t border-ink/15 pt-6 max-sm:mt-12 max-sm:gap-2" aria-label="Statistik sistem">
          {[['99.4%', 'Akurasi model'], ['< 2 dtk', 'Waktu analisis'], ['24/7', 'Proteksi aktif']].map(([value, label]) => <div className="grid gap-1.5" key={label}><strong className="text-xl tracking-[-.04em] max-sm:text-[17px]">{value}</strong><span className="text-[10px] font-bold uppercase tracking-[.1em] text-[#71807a] max-sm:text-[8px]">{label}</span></div>)}
        </div>
      </div>
      <Radar />
    </section>
  )
}

function ResultPanel({ result, onReset }) {
  if (!result) {
    return (
      <aside id="result-card" aria-live="polite" className="relative min-h-[485px] overflow-hidden rounded-3xl bg-ink text-white shadow-[0_30px_80px_rgba(5,15,12,.15)] max-[960px]:min-h-[470px]">
        <ResultBackdrop />
        <div className="relative z-10 flex min-h-full flex-col items-start justify-center p-12 max-sm:p-9">
          <div className="mb-7 grid size-[76px] place-items-center rounded-full border border-acid/35 bg-acid/[.06] text-acid"><ShieldIcon className="size-10" plus /></div>
          <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#92a09a]">Hasil analisis</p>
          <h3 className={`${displayTitle} my-2.5 text-[31px] leading-[1.05]`}>Belum ada sinyal<br />yang diperiksa.</h3>
          <p className="max-w-[310px] text-xs leading-relaxed text-[#85918d]">Hasil, tingkat risiko, dan saran tindakan akan muncul di sini.</p>
          <div className="mt-7 grid w-full gap-2"><i className="h-1 w-[85%] rounded-full bg-white/[.06]" /><i className="h-1 w-[64%] rounded-full bg-white/[.06]" /><i className="h-1 w-3/4 rounded-full bg-white/[.06]" /></div>
        </div>
      </aside>
    )
  }

  const config = LEVELS[result.level]
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
          {result.found.slice(0, 4).map((key) => { const [label, type] = SIGNALS[key] ?? [String(key), 'Model']; const safe = key === 'secure'; return <div key={key} className="grid min-h-[42px] grid-cols-[20px_1fr_auto] items-center gap-2 border-b border-white/[.08] text-[10px]"><i className={`grid size-[17px] place-items-center rounded-full text-[9px] not-italic ${safe ? 'bg-safe/10 text-safe' : 'bg-danger/10 text-danger'}`}>{safe ? '✓' : '!'}</i><span>{label}</span><small className="text-[8px] uppercase tracking-[.08em] text-[#7f8c86]">{type}</small></div> })}
        </div>
        <div className="mt-4 grid grid-cols-[25px_1fr] gap-2.5 bg-white/[.055] p-3"><span className="grid size-[22px] place-items-center rounded-full bg-acid text-[11px] font-black text-ink">!</span><p className="m-0 text-[9px] leading-relaxed text-[#aeb8b3]"><strong className="text-white">Saran Sentry</strong><br />{config.recommendation}</p></div>
        <button onClick={onReset} className="mt-[18px] flex w-full justify-between bg-transparent p-0 text-[10px] font-bold text-acid">Periksa ancaman lain <span>↗</span></button>
      </div>
    </aside>
  )
}

function ResultBackdrop() {
  return <><div className="absolute -right-40 -top-32 size-[280px] rounded-full border border-acid/15" /><div className="absolute -right-[105px] -top-[75px] size-[280px] rounded-full border border-acid/[.06]" /><div className="absolute -right-[50px] -top-5 size-[280px] rounded-full border border-acid/[.04]" /></>
}

function Scanner() {
  const demoMode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('demo') : null
  const isImageDemo = demoMode?.startsWith('image')
  const [mode, setMode] = useState(isImageDemo ? 'image' : 'url')
  const [url, setUrl] = useState(demoMode === 'threat' ? SAMPLE.url : '')
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
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
    if (fileRef.current) fileRef.current.value = ''
  }
  const useSample = async () => {
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
    setLoading(true)
    try {
      setResult(await detectThreat({ mode, value, file: imageFile }))
      if (window.innerWidth < 960) requestAnimationFrame(() => document.querySelector('#result-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Analisis gagal. Coba kembali.')
    } finally {
      setLoading(false)
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

  const tabBase = 'flex min-h-[53px] items-center justify-center gap-2.5 rounded-xl text-xs font-bold transition max-sm:text-[10px]'
  return (
    <section id="scanner" className={`${shell} border-t border-ink/15 py-[110px] max-sm:py-[85px]`} aria-labelledby="scanner-title">
      <div className="mb-12 flex items-end justify-between gap-12 max-sm:flex-col max-sm:items-start max-sm:gap-5">
        <div><Eyebrow number="02">Threat scanner</Eyebrow><h2 id="scanner-title" className={`${displayTitle} text-[clamp(45px,5vw,70px)] max-sm:text-[46px]`}>Ada yang terasa janggal?</h2></div>
        <p className="mb-1 max-w-[430px] text-sm leading-[1.7] text-[#69756f]">Periksa tautan, isi pesan, atau screenshot. Mode demo diproses lokal; adapter API sudah siap untuk model Anda.</p>
      </div>
      <div className="grid grid-cols-[1.15fr_.85fr] items-stretch gap-[18px] max-[960px]:grid-cols-1">
        <div className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_30px_80px_rgba(5,15,12,.15)]">
          <div className="m-[7px] grid grid-cols-3 rounded-[17px] bg-[#e5e5dc] p-[7px]" role="tablist" aria-label="Jenis analisis">
            <button type="button" role="tab" aria-selected={mode === 'url'} onClick={() => changeMode('url')} className={`${tabBase} ${mode === 'url' ? 'bg-white text-ink shadow-[0_5px_15px_rgba(12,24,20,.08)]' : 'text-[#6e7874]'}`}><LinkIcon className="size-[18px]" /><span><span className="max-sm:hidden">Periksa </span>URL</span></button>
            <button type="button" role="tab" aria-selected={mode === 'message'} onClick={() => changeMode('message')} className={`${tabBase} ${mode === 'message' ? 'bg-white text-ink shadow-[0_5px_15px_rgba(12,24,20,.08)]' : 'text-[#6e7874]'}`}><MailIcon className="size-[18px]" /><span><span className="max-sm:hidden">Analisis </span>Pesan</span></button>
            <button type="button" role="tab" aria-selected={mode === 'image'} onClick={() => changeMode('image')} className={`${tabBase} ${mode === 'image' ? 'bg-white text-ink shadow-[0_5px_15px_rgba(12,24,20,.08)]' : 'text-[#6e7874]'}`}><ImageIcon className="size-[18px]" />Screenshot</button>
          </div>
          <div className="px-[37px] pb-7 pt-9 max-sm:px-5 max-sm:pb-6 max-sm:pt-7">
            <div className="mb-3 flex items-center justify-between"><label htmlFor={mode === 'url' ? 'url-input' : mode === 'message' ? 'message-input' : 'image-input'} className="text-[11px] font-extrabold uppercase tracking-[.09em]">{mode === 'url' ? 'Alamat website' : mode === 'message' ? 'Isi pesan mencurigakan' : 'Screenshot mencurigakan'}</label><button onClick={mode === 'image' && imageFile ? clearImage : useSample} className="border-b border-[#a5ada9] bg-transparent pb-1 text-[10px] font-bold text-[#65716c]">{mode === 'image' && imageFile ? 'Hapus gambar' : 'Gunakan contoh'}</button></div>
            {mode === 'url' ? (
              <div className="flex min-h-[69px] items-center border border-[#c9cdc8] bg-[#f7f7f3] px-4 transition focus-within:border-[#6b8e4f] focus-within:shadow-[0_0_0_3px_rgba(107,142,79,.12)]">
                <span className="text-sm font-bold text-[#789161]">https://</span><input ref={urlRef} id="url-input" value={url} onChange={(event) => setUrl(event.target.value.replace(/^https?:\/\//i, ''))} onKeyDown={(event) => event.key === 'Enter' && scan()} className="h-[50px] min-w-0 flex-1 border-0 bg-transparent text-sm outline-0 placeholder:text-[#9ba49f]" placeholder="masukkan-alamat-situs.com" autoComplete="off" spellCheck="false" />
                {url && <button onClick={() => { setUrl(''); urlRef.current?.focus() }} aria-label="Hapus input" className="grid size-[25px] place-items-center rounded-full bg-[#e2e4dd] text-[#59635e]">×</button>}
              </div>
            ) : mode === 'message' ? (
              <div className="relative border border-[#c9cdc8] bg-[#f7f7f3] transition focus-within:border-[#6b8e4f] focus-within:shadow-[0_0_0_3px_rgba(107,142,79,.12)]"><textarea ref={messageRef} id="message-input" value={message} maxLength={2000} onChange={(event) => setMessage(event.target.value)} rows="6" className="min-h-[150px] w-full resize-y border-0 bg-transparent p-[18px] pb-10 text-[13px] leading-relaxed outline-0 placeholder:text-[#9ba49f]" placeholder="Tempel isi email, SMS, atau pesan WhatsApp mencurigakan di sini..." /><span className="absolute bottom-3 right-4 text-[9px] text-[#929b96]">{message.length.toLocaleString('id-ID')} / 2.000</span></div>
            ) : (
              <div onDragEnter={(event) => { event.preventDefault(); setDragActive(true) }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragActive(false)} onDrop={(event) => { event.preventDefault(); setDragActive(false); handleImage(event.dataTransfer.files[0]) }} className={`relative min-h-[230px] overflow-hidden border border-dashed bg-[#f7f7f3] transition ${dragActive ? 'border-[#6b8e4f] bg-acid/10 shadow-[0_0_0_3px_rgba(107,142,79,.12)]' : 'border-[#b9c1bc]'}`}>
                <input ref={fileRef} id="image-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleImage(event.target.files?.[0])} className="sr-only" />
                {previewUrl ? <><img src={previewUrl} alt="Preview screenshot yang akan dianalisis" className="h-[230px] w-full object-contain" /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/90 px-4 py-3 text-[9px] text-white backdrop-blur"><span className="max-w-[70%] truncate">{imageFile?.name}</span><span>{(imageFile.size / 1024 / 1024).toFixed(2)} MB</span></div></> : <button type="button" onClick={() => fileRef.current?.click()} className="absolute inset-0 flex w-full flex-col items-center justify-center bg-transparent px-5 text-center"><span className="mb-4 grid size-14 place-items-center rounded-full border border-[#88a371] bg-white text-[#6f9653]"><ImageIcon className="size-6" /></span><strong className="text-sm">Tarik screenshot ke sini</strong><span className="mt-1.5 text-[10px] text-[#7e8984]">atau klik untuk memilih dari perangkat</span></button>}
              </div>
            )}
            <p className="my-3 flex items-center gap-2 text-[10px] text-[#858f89]"><span className="grid size-[15px] shrink-0 place-items-center rounded-full border border-[#a7ada9] font-serif text-[9px]">i</span>{mode === 'image' ? 'PNG, JPG, atau WebP — maksimum 8 MB. Preview tetap lokal pada mode demo.' : 'Hindari memasukkan kata sandi atau data pribadi sensitif.'}</p>
            <button disabled={loading} onClick={scan} className="mt-[18px] flex h-[58px] w-full items-center justify-center bg-ink text-xs font-extrabold text-white transition hover:-translate-y-px hover:bg-[#1b302a] disabled:cursor-wait">
              {loading ? <span className="flex items-center gap-3"><i className="spin size-3.5 rounded-full border-2 border-white/30 border-t-acid" />{mode === 'image' ? 'Membaca screenshot...' : 'Membaca sinyal...'}</span> : <span className="flex items-center gap-2.5"><SearchIcon className="size-[17px] text-acid" />{mode === 'image' ? 'Analisis screenshot' : 'Mulai analisis'}</span>}
            </button>
          </div>
          <div className="flex h-[52px] items-center justify-between border-t border-[#e6e6df] px-[37px] text-[9px] uppercase tracking-[.06em] text-[#818b86] max-sm:px-5"><span className="flex items-center gap-2 text-[#6f9653]"><ShieldIcon className="size-3.5" /> <span className="text-[#818b86]">Demo lokal</span></span><span className="max-sm:hidden">Model <strong className="text-[#56625d]">API-ready</strong></span></div>
        </div>
        <ResultPanel result={result} onReset={() => { setResult(null); if (mode !== 'image') (mode === 'url' ? urlRef.current : messageRef.current)?.focus() }} />
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

function Footer() {
  return <footer className="bg-paper pt-[75px]"><div className={`${shell} grid grid-cols-[1fr_1fr_.5fr] gap-20 pb-[70px] max-[960px]:grid-cols-1 max-[960px]:gap-9`}><div><Brand /><p className="mt-5 text-xs leading-relaxed text-[#69756f]">Lapisan tenang di antara Anda<br />dan ancaman digital.</p></div><div><span className="text-[9px] font-extrabold tracking-[.12em] text-[#6e7b76]">DEMO INTERAKTIF</span><p className="max-w-[390px] text-[11px] leading-[1.7] text-[#69756f]">Antarmuka ini menggunakan aturan heuristik untuk demonstrasi UI. Gunakan solusi keamanan terverifikasi untuk keputusan dunia nyata.</p></div><div className="flex flex-col gap-3.5 text-[11px] font-bold max-[960px]:flex-row max-[960px]:flex-wrap"><a href="#scanner">Pemindai</a><a href="#cara-kerja">Cara kerja</a><a href="#wawasan">Wawasan</a></div></div><div className={`${shell} flex h-[65px] items-center justify-between border-t border-ink/15 text-[9px] uppercase tracking-[.08em] text-[#828d88]`}><span>© 2026 Sentry Labs</span><span className="max-sm:hidden">Dibuat untuk internet yang lebih aman.</span></div></footer>
}

export default function App() {
  return (
    <>
      <div className="noise pointer-events-none fixed inset-0 z-50 opacity-[.025]" aria-hidden="true" />
      <Header />
      <main id="top"><Hero /><Scanner /><MethodSection /><Insights /></main>
      <Footer />
    </>
  )
}
