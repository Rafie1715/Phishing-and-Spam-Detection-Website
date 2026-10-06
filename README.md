# Sentry — Phishing & Spam Detection UI

Prototype React interaktif untuk pemeriksaan URL, pesan, dan screenshot mencurigakan, dibangun dengan Vite dan Tailwind CSS.

## Menjalankan

```bash
npm install
npm run dev
```

Buka **http://localhost:5173** (bukan `127.0.0.1`, karena CORS backend membedakan keduanya). Backend Vercel sudah menjadi konfigurasi default, sehingga tidak perlu menjalankan backend lokal. Untuk melihat state hasil ancaman secara langsung, tambahkan query berikut:

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
- Pemindai URL dan isi pesan melalui model backend; aturan heuristik lokal hanya untuk simulasi
- Upload screenshot melalui pemilih file atau drag-and-drop
- Preview lokal, validasi PNG/JPG/WebP, dan batas ukuran 4 MB
- Hasil klasifikasi, rincian sinyal, dan rekomendasi tindakan
- Contoh simulasi URL, pesan, dan gambar yang dapat dicoba tanpa login; hasil diberi label simulasi dan tidak dikirim ke backend
- Navigasi responsif dan menu mobile
- Penanda navigasi aktif mengikuti posisi halaman
- Desain editorial dengan warna kertas hangat, tipografi Lora/Manrope, dan aksen merah bata
- Radar animasi dengan sapuan cahaya, sinyal berdenyut, kontrol jeda, serta dukungan reduced motion; loading state dan toast untuk pemeriksaan
- Mode demo tidak mengirim data keluar dari browser
- Panduan tiga langkah, penjelasan skor, salin ringkasan, catatan edukasi, dan FAQ interaktif
- Login, registrasi, verifikasi, pemulihan kata sandi, dan panel riwayat pemeriksaan

## Pemeriksaan UI lokal

Desain dan alur lokal diperiksa pada lebar 320, 390, 768, dan 1440 piksel. Screenshot serta laporan tersedia di `artifacts/`.

Untuk mengulang smoke check, jalankan Vite di `http://localhost:5173` dan browser Edge khusus pengujian dengan remote debugging port `9225`, lalu jalankan `node scripts/review-ui.mjs`. Gunakan profil browser pengujian terpisah, bukan profil pribadi.

Jalankan `npm test` untuk pengujian kontrak layanan dengan respons tiruan (tanpa koneksi jaringan). Tambahkan `--backend` pada smoke check untuk memeriksa `/health`, respons `/auth/me` tanpa login (401), dan validasi `/auth/login` dengan body kosong (422) melalui CORS browser. Pemeriksaan ini tidak membuat akun, mengirim email, atau melakukan analisis sungguhan. Login/OTP, logout dengan cookie aktif, dan hasil model end-to-end tetap perlu diuji dengan akun uji yang terverifikasi.

## Menghubungkan backend FastAPI

Frontend menggunakan API yang sudah di-deploy di `https://scam-project-backend.vercel.app`, dengan kontrak endpoint dari `/openapi.json`.
Konfigurasi opsional: salin `.env.example` menjadi `.env.local` untuk mengganti nilai default:

```env
VITE_API_BASE_URL=https://scam-project-backend.vercel.app
VITE_API_ENABLED=true
VITE_API_TIMEOUT_MS=60000
```

Restart Vite setelah mengubah environment. Di PowerShell yang memblokir `npm.ps1`, gunakan `npm.cmd run dev`. Port 5173 dikunci agar Vite tidak berpindah diam-diam ke origin yang belum diizinkan CORS. Jika port terpakai, gunakan server yang sedang aktif atau hentikan server lama terlebih dahulu. `npm run preview` juga memakai origin yang sama; hentikan dev server sebelum menjalankan preview.

Jika ingin menggunakan backend lokal, ganti `VITE_API_BASE_URL` menjadi `http://localhost:8000` dan izinkan origin frontend tersebut pada CORS backend. Jangan menyimpan password, token, atau rahasia pada variabel `VITE_*`; nilainya dapat dilihat publik di bundle frontend.

Alur yang digunakan:

1. Register melalui `POST /auth/register`.
2. Verifikasi email melalui `POST /auth/verify-otp`.
3. Login melalui `POST /auth/login`.
4. Pemulihan akun memakai `POST /auth/forgot-password` dan `POST /auth/reset-password`.
5. Access token dikirim sebagai header Bearer dan disimpan di memori halaman. Saat halaman dimuat ulang, frontend mencoba memulihkan sesi memakai cookie refresh token; gunakan tombol Keluar untuk mengakhiri sesi.
6. Keluar akun membersihkan access token di frontend dan memanggil `POST /auth/logout` untuk meminta backend menghapus cookie sesi. Kegagalan logout server ditampilkan dengan opsi mencoba lagi.

Semua request menggunakan `credentials: include`. Frontend memakai `/auth/refresh` untuk memulihkan sesi dan mengulang permintaan terautentikasi yang menerima 401 sebanyak satu kali. Permintaan refresh bersamaan digabungkan. Jika refresh gagal, pengguna perlu masuk kembali. Cookie lintas situs bergantung pada pengaturan backend dan kebijakan browser.

Kontrak deteksi:

- URL: `POST /detection/url` dengan JSON `{ "url": "https://..." }`, mengikuti penambahan endpoint pada kode integrasi terbaru.
- Pesan: `POST /detection/text` dengan JSON `{ "text": "..." }`.
- Screenshot: `POST /detection/image` dengan file pada multipart field `file`.
- Riwayat: `GET /detection/history?page=1&size=8`.
- Hapus riwayat: `DELETE /detection/history/{id}`.

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

> Screenshot dikirim ke endpoint gambar, tetapi kualitas OCR dan hasil model perlu diverifikasi bersama pengembang backend menggunakan akun uji. Frontend tidak menganggap hasil simulasi sebagai hasil model asli.

> Upload dibatasi 4 MB agar file beserta multipart header tetap di bawah [batas request Vercel Functions 4,5 MB](https://vercel.com/docs/functions/limitations#request-body-size). Screenshot yang lebih besar perlu diperkecil terlebih dahulu.

## Deployment frontend dan CORS

1. Pada hosting frontend, set `VITE_API_BASE_URL=https://scam-project-backend.vercel.app`, `VITE_API_ENABLED=true`, dan `VITE_API_TIMEOUT_MS=60000`.
2. Gunakan build command `npm run build` dan output directory `dist`. Environment Vite dibaca saat build, jadi lakukan rebuild/redeploy setiap kali nilainya berubah.
3. Minta pengembang backend menambahkan **origin frontend yang sebenarnya** (misalnya `https://nama-frontend.netlify.app`) ke daftar CORS, termasuk domain custom jika digunakan. Izinkan credentials serta header `Content-Type` dan `Authorization`; jangan gunakan wildcard `*` untuk credentialed requests.
4. Pastikan metode `GET`, `POST`, `DELETE`, dan preflight `OPTIONS` diizinkan. Untuk cookie lintas situs, konfigurasi `Secure` dan `SameSite=None` perlu diperiksa di backend; browser masih dapat membatasi cookie pihak ketiga.
5. Buka frontend dan pastikan status pemindai menampilkan **Layanan terhubung**. Jika belum, klik **Cek ulang koneksi** dan periksa respons request/preflight pada DevTools Network. Keberhasilan health check tidak menjamin model, database, dan layanan email semuanya sehat.
6. Uji registrasi/verifikasi akun, login, analisis teks, upload screenshot, riwayat, dan logout dengan akun uji sendiri sebelum rilis.

Saat pemeriksaan integrasi, backend mengizinkan `http://localhost:5173` tetapi menolak `http://127.0.0.1:5173`. Domain deployment frontend belum diverifikasi karena belum diberikan. Konfigurasi CORS berada di backend dan tidak dapat diperbaiki hanya dengan perubahan frontend.
