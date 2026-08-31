# Sentry — Phishing & Spam Detection UI

Prototype React interaktif untuk pemeriksaan URL, pesan, dan screenshot mencurigakan, dibangun dengan Vite dan Tailwind CSS.

## Menjalankan

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite. Untuk melihat state hasil ancaman secara langsung, tambahkan query berikut:

```text
?demo=threat
```

Build produksi:

```bash
npm run build
```

## Fitur

- Komponen React dengan state UI terkelola
- Styling responsif menggunakan Tailwind CSS v4
- Pemindai URL dan isi pesan dengan aturan heuristik lokal
- Upload screenshot melalui pemilih file atau drag-and-drop
- Preview lokal, validasi PNG/JPG/WebP, dan batas ukuran 8 MB
- Skor risiko, rincian sinyal, dan rekomendasi tindakan
- Contoh input untuk demonstrasi cepat
- Navigasi responsif dan menu mobile
- Animasi radar, loading state, toast, serta dukungan reduced motion
- Mode demo tidak mengirim data keluar dari browser

## Menghubungkan model

Salin `.env.example` menjadi `.env`, kemudian arahkan variabel berikut ke endpoint inferensi Anda:

```env
VITE_DETECTION_API_URL=http://localhost:8000/analyze
```

Kontrak request yang digunakan oleh `src/services/detectionService.js`:

- URL/pesan: JSON `{ "mode": "url|message", "content": "..." }`
- Screenshot: `multipart/form-data` dengan field `mode=image` dan file pada field `image`

Contoh response model:

```json
{
  "score": 84,
  "level": "high",
  "signals": ["visualBrand", "visualUrgency", "visualForm"],
  "report_id": 15235
}
```

Jika variabel API tidak diisi, aplikasi otomatis menggunakan simulasi lokal dan tidak mengunggah screenshot.

> Catatan: mesin analisis pada versi ini adalah simulasi front-end untuk kebutuhan UI/UX, bukan pengganti layanan keamanan produksi.
