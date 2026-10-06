import { useState } from 'react'

export default function RadarVisual() {
  const [paused, setPaused] = useState(false)

  return (
    <figure className="radar-figure" data-paused={paused} aria-label="Ilustrasi radar pemindai Sentry">
      <div className="radar-instrument" aria-hidden="true">
        <div className="radar-face">
          <div className="radar-grid" />
          <svg className="radar-scale" viewBox="0 0 400 400" fill="none">
            {[...Array(60)].map((_, index) => <path key={index} d={index % 5 === 0 ? 'M200 13v10' : 'M200 13v4'} transform={`rotate(${index * 6} 200 200)`} />)}
            <circle cx="200" cy="200" r="162" />
            <circle cx="200" cy="200" r="113" />
            <circle cx="200" cy="200" r="64" />
            <path d="M200 36v328M36 200h328" />
          </svg>
          <div className="radar-sweep" />
          <span className="radar-echo radar-echo-one" />
          <span className="radar-echo radar-echo-two" />
          <span className="radar-echo radar-echo-three" />
          <div className="radar-center">
            <svg viewBox="0 0 40 44" fill="none"><path d="m20 3 15 6v11c0 10-7 16-15 20C12 36 5 30 5 20V9Z" stroke="currentColor" strokeWidth="1.6" /><path d="m12 21 5 5 11-12" stroke="currentColor" strokeWidth="1.8" /></svg>
          </div>
          <span className="radar-bearing radar-north">000°</span>
          <span className="radar-bearing radar-south">180°</span>
        </div>
        <span className="radar-tag radar-tag-url"><i />Pola URL</span>
        <span className="radar-tag radar-tag-message"><i />Isi pesan</span>
        <span className="radar-tag radar-tag-image"><i />Gambar</span>
      </div>
      <figcaption className="radar-caption"><span><i aria-hidden="true" />Ilustrasi pemindaian</span><button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} aria-label={paused ? 'Lanjutkan animasi radar' : 'Jeda animasi radar'}>{paused ? 'Lanjutkan' : 'Jeda'}<span aria-hidden="true">{paused ? '▷' : 'Ⅱ'}</span></button></figcaption>
    </figure>
  )
}
