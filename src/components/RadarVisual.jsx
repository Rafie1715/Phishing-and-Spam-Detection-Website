import { useState } from 'react'

export default function RadarVisual() {
  const [paused, setPaused] = useState(false)

  return (
    <figure className="radar-figure" data-paused={paused} aria-label="Ilustrasi radar pemindai Sentry">
      <div className="radar-instrument" aria-hidden="true">
        <div className="radar-face">
          <div className="radar-grid" />

          {/* Radar Scale & Concentric Rings */}
          <svg className="radar-scale" viewBox="0 0 400 400" fill="none">
            {[...Array(60)].map((_, index) => (
              <path
                key={index}
                d={index % 5 === 0 ? 'M200 12v12' : 'M200 12v5'}
                transform={`rotate(${index * 6} 200 200)`}
              />
            ))}
            <circle cx="200" cy="200" r="162" />
            <circle cx="200" cy="200" r="113" />
            <circle cx="200" cy="200" r="64" />
            <path d="M200 36v328M36 200h328" />
          </svg>

          {/* Rotating Beam */}
          <div className="radar-sweep" />

          {/* Echo Detection Points */}
          <span className="radar-echo radar-echo-one" />
          <span className="radar-echo radar-echo-two" />
          <span className="radar-echo radar-echo-three" />

          {/* Center Tactical Crest */}
          <div className="radar-center">
            <svg viewBox="0 0 40 44" fill="none">
              <path d="m20 3 15 6v11c0 10-7 16-15 20C12 36 5 30 5 20V9Z" stroke="#00e5ff" strokeWidth="2" />
              <path d="m12 21 5 5 11-12" stroke="#00f59b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <span className="radar-bearing radar-north">000°</span>
          <span className="radar-bearing radar-south">180°</span>
        </div>

        {/* Clean Signal Tags */}
        <span className="radar-tag radar-tag-url">
          <i />
          <span>Pola URL</span>
        </span>
        <span className="radar-tag radar-tag-message">
          <i />
          <span>Isi pesan</span>
        </span>
        <span className="radar-tag radar-tag-image">
          <i />
          <span>Screenshot</span>
        </span>
      </div>

      <figcaption className="radar-caption">
        <div className="radar-status-indicator">
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            {paused ? (
              <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
            ) : (
              <>
                <span className="animate-ping absolute inline-flex size-2.5 rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </>
            )}
          </span>
          <span className="radar-caption-title">
            {paused ? 'Animasi radar dijeda' : 'Radar multi-vektor aktif'}
          </span>
          <span className="radar-caption-badge" data-paused={paused}>
            {paused ? 'DIJEDA' : 'LIVE'}
          </span>
        </div>
        <button
          type="button"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
          className="radar-control-btn"
          aria-label={paused ? 'Lanjutkan animasi radar' : 'Jeda animasi radar'}
        >
          <span aria-hidden="true" className="text-[10px]">{paused ? '▶' : '⏸'}</span>
          <span>{paused ? 'Lanjutkan' : 'Jeda'}</span>
        </button>
      </figcaption>
    </figure>
  )
}
