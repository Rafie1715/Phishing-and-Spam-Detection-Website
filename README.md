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
- Panduan tiga langkah, animasi proses, penjelasan skor, salin ringkasan, dan FAQ interaktif

## Menghubungkan backend FastAPI

Frontend sudah disesuaikan dengan repository `https://github.com/dihaayyy/scam-project-backend`.
Salin `.env.example` menjadi `.env.local`, lalu isi base URL backend:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_ENABLED=true
```

Jalankan backend pada port `8000`, pastikan CORS backend menyertakan `http://localhost:5173`, lalu jalankan frontend dengan `npm run dev`.

Alur yang digunakan:

1. Register melalui `POST /auth/register`.
2. Verifikasi email melalui `POST /auth/verify-otp`.
3. Login melalui `POST /auth/login`.
4. Access token dikirim sebagai header Bearer untuk setiap analisis.

Kontrak deteksi:

- URL/pesan: `POST /detection/text` dengan JSON `{ "text": "..." }`.
- Screenshot: `POST /detection/image` dengan file pada multipart field `file`.
- Riwayat: `GET /detection/history?page=1&size=10`.

Contoh respons backend:

```json
{
  "id": 1,
  "input_type": "text",
  "input_text": "Akun Anda akan diblokir",
  "extracted_text": null,
  "verdict": "scam",
  "confidence_score": 0.97,
  "category": "penipuan",
  "created_at": "2026-09-06T10:00:00Z"
}
```

Untuk kembali ke simulasi lokal tanpa backend, set `VITE_API_ENABLED=false` lalu restart Vite.

> Catatan: OCR pada backend saat ini masih placeholder. Endpoint screenshot sudah terhubung, tetapi backend perlu implementasi OCR asli agar isi gambar benar-benar dianalisis.
