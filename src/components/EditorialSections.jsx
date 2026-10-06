import { useState } from 'react'
import RadarVisual from './RadarVisual.jsx'

export function Hero() {
  return (
    <section className="site-shell hero-section" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow"><span className="small-cross" aria-hidden="true">+</span> Sedikit ragu. Lebih terlindungi.</p>
        <h1 id="hero-title">Jangan buru-buru<br />percaya<span className="text-rust">.</span></h1>
        <p className="hero-description">Pesan meyakinkan belum tentu aman. Periksa tautan, pesan, dan screenshot yang mencurigakan sebelum mengambil langkah berikutnya.</p>
        <div className="hero-actions">
          <a className="primary-button" href="#scanner">Periksa sekarang <span aria-hidden="true">↗</span></a>
          <a className="text-link" href="#cara-kerja">Bagaimana cara kerjanya? <span aria-hidden="true">↓</span></a>
        </div>
        <p className="hero-footnote"><span aria-hidden="true">↳</span> Untuk momen ketika insting Anda bilang, “tunggu dulu.”</p>
      </div>

      <RadarVisual />
    </section>
  )
}

export function MethodSection() {
  return (
    <section id="cara-kerja" className="site-shell method-section section-anchor" aria-labelledby="method-title">
      <div className="section-intro"><p className="eyebrow">02 / Cara kerja</p><h2 id="method-title" className="section-title">Dari rasa ragu,<br />ke langkah yang jelas.</h2><p>Tidak perlu mengerti istilah keamanan untuk mulai memeriksa.</p></div>
      <ol className="method-list">
        {[
          ['Bawa yang mencurigakan.', 'Tempel tautan atau teks pesan. Kalau informasinya ada di gambar, unggah screenshot yang terbaca.'],
          ['Baca hasilnya, pahami alasannya.', 'Lihat klasifikasi dan penjelasan yang tersedia. Hasil model adalah petunjuk untuk pemeriksaan lebih lanjut.'],
          ['Tentukan langkah berikutnya.', 'Ikuti saran tindakan, verifikasi lewat kanal resmi, dan simpan hasil dalam riwayat akun Anda.'],
        ].map(([title, text], i) => <li key={title}><span className="method-number">0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div><span className="method-arrow" aria-hidden="true">↗</span></li>)}
      </ol>
    </section>
  )
}

const fieldNotes = [
  { tag: 'Identitas pengirim', title: 'Nama familiar. Alamat berbeda.', excerpt: 'Penipu meminjam nama yang sudah Anda percaya.', detail: 'Buka detail pengirim dan periksa alamat lengkapnya. Logo, foto profil, dan nama tampilan dapat ditiru.', example: <>layanan@<span>bank-aman.example</span></> },
  { tag: 'Tekanan waktu', title: '“Sekarang” bukan alasan untuk terburu-buru.', excerpt: 'Ancaman pemblokiran sering dipakai untuk memancing panik.', detail: 'Berhenti sejenak. Buka aplikasi resmi secara langsung untuk memeriksa apakah benar ada masalah pada akun Anda.', example: <>“Akun ditutup dalam <span>10 menit!</span>”</> },
  { tag: 'Informasi pribadi', title: 'Ada hal yang cukup Anda sendiri yang tahu.', excerpt: 'OTP, PIN, dan kata sandi bukan bahan percakapan.', detail: 'Jangan kirim data tersebut ke pengirim pesan. Jika sudah terlanjur, segera amankan akun lewat aplikasi atau situs resminya.', example: <>“Kirim <span>kode OTP</span> untuk verifikasi.”</> },
]

export function Insights() {
  const [expanded, setExpanded] = useState(null)
  return (
    <section id="wawasan" className="notes-section section-anchor" aria-labelledby="insight-title">
      <div className="site-shell">
        <div className="notes-heading"><div><p className="eyebrow">03 / Bekal sebelum klik</p><h2 id="insight-title" className="section-title">Kenali cara mereka bekerja.</h2></div><span className="notes-edition">CATATAN LAPANGAN<br /><span>Untuk keseharian digital Anda</span></span></div>
        <div className="field-notes">{fieldNotes.map((note, i) => <article key={note.tag} className="field-note"><p className="eyebrow">0{i + 1} — {note.tag}</p><div className="note-example">{note.example}</div><h3>{note.title}</h3><p>{note.excerpt}</p><button type="button" aria-expanded={expanded === i} aria-controls={`note-detail-${i}`} className="note-toggle" onClick={() => setExpanded(expanded === i ? null : i)}>Yang bisa Anda lakukan <span aria-hidden="true">{expanded === i ? '−' : '+'}</span></button><div id={`note-detail-${i}`} hidden={expanded !== i} className="note-detail">{note.detail}</div></article>)}</div>
      </div>
    </section>
  )
}

const faqs = [
  ['Apakah hasil “risiko rendah” berarti pasti aman?', 'Belum tentu. Model dapat melewatkan ancaman. Tetap periksa identitas pengirim dan buka layanan melalui aplikasi atau alamat resmi yang Anda ketik sendiri.'],
  ['Apa bedanya pemeriksaan URL, pesan, dan screenshot?', 'URL digunakan untuk pola pada alamat website; saat ini belum memeriksa reputasi domain. Pesan memeriksa isi teks. Screenshot mengirim gambar untuk dianalisis oleh layanan; fitur ini masih beta dan bergantung pada kesiapan pembacaan gambar.'],
  ['Apakah data saya dikirim dan disimpan?', 'Pemeriksaan asli mengirim input ke layanan analisis yang dikonfigurasi dan menyimpan hasil di riwayat akun. Contoh simulasi berjalan lokal. Tutupi informasi pribadi yang tidak diperlukan sebelum mengunggah gambar.'],
  ['Mengapa saya perlu masuk?', 'Akun diperlukan untuk menggunakan layanan analisis dan melihat riwayat pribadi. Untuk mengenal tampilannya, Anda bisa mencoba contoh simulasi tanpa masuk.'],
]

export function HelpCenter() {
  const [open, setOpen] = useState(0)
  return (
    <section id="bantuan" className="site-shell help-section section-anchor" aria-labelledby="help-title">
      <div className="section-intro"><p className="eyebrow">04 / Pertanyaan yang wajar</p><h2 id="help-title" className="section-title">Masih ada<br />yang mengganjal?</h2><p>Memahami batas alat ini juga bagian dari menjaga diri.</p></div>
      <div className="faq-list">{faqs.map(([q, a], i) => <article key={q}><h3><button type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? null : i)}><span>{q}</span><span className="faq-symbol" aria-hidden="true">{open === i ? '−' : '+'}</span></button></h3><p id={`faq-${i}`} hidden={open !== i}>{a}</p></article>)}</div>
    </section>
  )
}

export function Footer() {
  return <footer className="site-shell site-footer"><div><a href="#top" className="footer-wordmark">sentry<span>®</span></a><p>Satu jeda sebelum percaya.</p></div><p className="footer-note">Alat bantu pemeriksaan phishing & spam.<br />Keputusan terbaik tetap dimulai dari kewaspadaan Anda.</p><a href="#top" className="text-link">Kembali ke atas <span aria-hidden="true">↑</span></a><div className="footer-bottom"><span>© {new Date().getFullYear()} Sentry</span><span>Dibuat untuk kebiasaan digital yang lebih baik.</span></div></footer>
}
