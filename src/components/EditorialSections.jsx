import { useState } from 'react'
import RadarVisual from './RadarVisual.jsx'

export function Hero() {
  return (
    <section className="site-shell hero-section" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title">
          Jangan buru-buru<br />
          <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
            percaya
          </span>
          <span className="text-cyan-400">.</span>
        </h1>

        <p className="hero-description">
          Pesan meyakinkan belum tentu aman. Periksa tautan, pesan WhatsApp/SMS, dan screenshot yang mencurigakan sebelum mengambil langkah berikutnya.
        </p>

        <div className="hero-actions">
          <a className="primary-button group" href="#scanner">
            <span>Periksa sekarang</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a className="secondary-button" href="#cara-kerja">
            <span>Bagaimana cara kerjanya?</span>
            <span aria-hidden="true">↓</span>
          </a>
        </div>

        <p className="hero-footnote">
          <span aria-hidden="true">↳</span> Untuk momen ketika insting Anda berbisik: <em>“Tunggu dulu, periksa dulu.”</em>
        </p>
      </div>

      <RadarVisual />
    </section>
  )
}

export function MethodSection() {
  return (
    <section id="cara-kerja" className="site-shell method-section section-anchor" aria-labelledby="method-title">
      <div className="section-intro">
        <p className="eyebrow">
          <span className="eyebrow-index">02</span>
          <span className="eyebrow-text">Cara kerja</span>
        </p>
        <h2 id="method-title" className="section-title">
          Dari rasa ragu,<br />ke langkah yang jelas.
        </h2>
        <p>Tidak perlu mengerti istilah teknis keamanan siber untuk mulai melindungi diri.</p>
      </div>

      <ol className="method-list">
        {[
          [
            'Bawa yang mencurigakan.',
            'Tempel tautan alamat web, salin isi pesan dari WhatsApp atau SMS, atau unggah screenshot bukti transfer yang terasa janggal.',
            '01',
          ],
          [
            'Baca hasilnya, pahami alasannya.',
            'Lihat skor risiko dan indikator ancaman yang terdeteksi, mulai dari ekstensi domain berisiko hingga manipulasi kata-kata panik.',
            '02',
          ],
          [
            'Tentukan langkah aman berikutnya.',
            'Ikuti rekomendasi tindakan yang jelas: abaikan pesan, blokir nomor kontak, atau lakukan verifikasi langsung ke pihak resmi.',
            '03',
          ],
        ].map(([title, text, num]) => (
          <li key={title} className="group">
            <span className="method-number">{num}</span>
            <div className="flex-1">
              <h3 className="group-hover:text-cyan-300 transition-colors">{title}</h3>
              <p>{text}</p>
            </div>
            <span className="method-arrow group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" aria-hidden="true">
              ↗
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

const fieldNotes = [
  {
    tag: 'Nama & Akun Palsu',
    title: 'Nama Terlihat Asli, Tapi Alamat Web Palsu',
    excerpt: 'Penipu sering memakai nama dan logo resmi bank atau instansi agar Anda langsung percaya tanpa curiga.',
    detail: 'Selalu periksa detail alamat pengirim dan tautan web secara teliti. Nama tampilan dan foto profil bisa dibuat sama persis oleh siapapun.',
    example: (
      <>
        layanan@<span className="rounded bg-rose-500/20 px-1 py-0.5 font-bold text-rose-300 border border-rose-500/30">bank-aman.xyz</span>
      </>
    ),
  },
  {
    tag: 'Dibuat Panik',
    title: 'Dipaksa Buru-Buru? Jangan Langsung Panik',
    excerpt: 'Ancaman rekening diblokir atau denda mendadak sengaja dipakai agar Anda buru-buru menuruti perintah penipu.',
    detail: 'Tenang dan jangan buru-buru mengklik tautan. Buka aplikasi resmi secara mandiri untuk mengecek apakah akun Anda benar-benar bermasalah.',
    example: (
      <>
        “Akun diblokir jika tidak verifikasi dalam <span className="rounded bg-amber-500/20 px-1 py-0.5 font-bold text-amber-300 border border-amber-500/30">10 menit!</span>”
      </>
    ),
  },
  {
    tag: 'Minta Data Rahasia',
    title: 'Jangan Pernah Bagikan Kode OTP atau PIN',
    excerpt: 'Pihak bank atau perusahaan resmi tidak akan pernah meminta kode OTP, PIN, maupun password Anda.',
    detail: 'Kode OTP dan PIN sifatnya sangat rahasia untuk akun Anda. Siapapun yang meminta kode tersebut—apapun alasannya—sudah pasti penipuan.',
    example: (
      <>
        “Kirimkan <span className="rounded bg-rose-500/20 px-1 py-0.5 font-bold text-rose-300 border border-rose-500/30">kode OTP 6 digit</span> untuk verifikasi.”
      </>
    ),
  },
]

export function Insights() {
  const [expanded, setExpanded] = useState(null)
  return (
    <section id="wawasan" className="notes-section section-anchor" aria-labelledby="insight-title">
      <div className="site-shell">
        <div className="notes-heading">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-index">03</span>
              <span className="eyebrow-text">Tips waspada penipuan</span>
            </p>
            <h2 id="insight-title" className="section-title">Kenali 3 trik yang sering dipakai penipu.</h2>
          </div>
          <div className="notes-edition">
            <span className="notes-edition-badge">Panduan Praktis</span>
            <p className="mt-1 text-slate-400">Kenali cirinya sebelum Anda tertipu</p>
          </div>
        </div>

        <div className="field-notes">
          {fieldNotes.map((note, i) => (
            <article key={note.tag} className="field-note">
              <p className="eyebrow">
                <span className="eyebrow-index">0{i + 1}</span>
                <span className="eyebrow-text">{note.tag}</span>
              </p>
              <div className="note-example">{note.example}</div>
              <h3>{note.title}</h3>
              <p>{note.excerpt}</p>
              <button
                type="button"
                aria-expanded={expanded === i}
                aria-controls={`note-detail-${i}`}
                className="note-toggle"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <span>Cara aman mencegahnya</span>
                <span aria-hidden="true">{expanded === i ? '−' : '+'}</span>
              </button>
              <div id={`note-detail-${i}`} hidden={expanded !== i} className="note-detail">
                {note.detail}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const faqs = [
  ['Apakah hasil “risiko rendah” berarti pasti 100% aman?', 'Belum tentu. Model deteksi dapat melewatkan ancaman baru yang belum terpetakan. Selalu periksa kembali identitas pengirim dan buka layanan melalui aplikasi atau alamat web resmi yang Anda ketik sendiri.'],
  ['Apa perbedaan pemeriksaan URL, pesan, dan screenshot?', 'Pemeriksaan Tautan (URL) membedah struktur domain dan ekstensi berisiko. Pemeriksaan Pesan menganalisis pola intimidasi bahasa dan iming-iming hadiah. Fitur Screenshot (Beta) mengekstrak teks visual untuk mendeteksi formulir login tiruan.'],
  ['Apakah data saya dikirim dan disimpan?', 'Pemeriksaan asli mengirim input ke layanan analisis untuk inferensi dan menyimpan hasilnya di riwayat akun privat Anda. Mode contoh simulasi berjalan lokal di peramban Anda. Selalu tutupi data pribadi sensitif sebelum mengunggah gambar.'],
  ['Mengapa saya perlu masuk akun?', 'Akun diperlukan untuk menggunakan layanan analisis cloud dan melihat riwayat pemeriksaan pribadi Anda. Anda tetap dapat mencoba seluruh simulasi secara gratis tanpa perlu masuk.'],
]

export function HelpCenter() {
  const [open, setOpen] = useState(0)

  return (
    <section id="bantuan" className="site-shell help-section section-anchor" aria-labelledby="help-title">
      <div className="section-intro">
        <p className="eyebrow">
          <span className="eyebrow-index">04</span>
          <span className="eyebrow-text">Pertanyaan umum</span>
        </p>
        <h2 id="help-title" className="section-title">
          Masih ada<br />yang mengganjal?
        </h2>
        <p>Memahami batasan dan cara kerja alat bantu adalah bagian penting dari menjaga keamanan diri.</p>
      </div>

      <div className="faq-list">
        {faqs.map(([q, a], i) => (
          <article key={q}>
            <h3>
              <button
                type="button"
                aria-expanded={open === i}
                aria-controls={`faq-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{q}</span>
                <span className="faq-symbol" aria-hidden="true">
                  {open === i ? '−' : '+'}
                </span>
              </button>
            </h3>
            <p id={`faq-${i}`} hidden={open !== i}>
              {a}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="site-shell site-footer">
      <div>
        <a href="#top" className="footer-wordmark flex items-center gap-2">
          <svg className="h-7 w-7 text-cyan-400" viewBox="0 0 32 36" fill="none" aria-hidden="true">
            <path d="M16 2 29 7v10c0 8-6 13-13 17C9 30 3 25 3 17V7Z" stroke="currentColor" strokeWidth="2.2" />
            <path d="m10 17 4 4 8-9" stroke="#00f59b" strokeWidth="2.5" />
          </svg>
          <span>sentry<span className="text-cyan-400">®</span></span>
        </a>
        <p className="text-slate-400 font-sans text-xs mt-2">
          Satu jeda sebelum percaya.
        </p>
      </div>

      <p className="footer-note">
        Alat bantu pemeriksaan phishing & spam.<br />
        Keputusan terbaik tetap dimulai dari kewaspadaan dan verifikasi Anda.
      </p>

      <a href="#top" className="text-link">
        <span>Kembali ke atas</span>
        <span aria-hidden="true">↑</span>
      </a>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Sentry</span>
        <span>Dibuat untuk kebiasaan digital yang lebih aman.</span>
      </div>
    </footer>
  )
}
