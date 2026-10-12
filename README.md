# Sentry — Deteksi Phishing & Spam

Website React untuk membantu memeriksa tautan dan pesan mencurigakan, dengan backend analisis terpisah. Dibangun menggunakan React, Vite, dan Tailwind CSS; fitur screenshot saat ini tersedia sebagai pratinjau dan simulasi.

**Website live: [sentry-phishing-scam.netlify.app](https://sentry-phishing-scam.netlify.app/)**

> Hasil pemeriksaan adalah petunjuk, bukan jaminan mutlak keamanan. Verifikasi informasi penting melalui aplikasi atau kanal resmi.

## Teknologi

- React 19 dan Vite 8.
- Tailwind CSS 4 dengan desain gelap dan aksen cyan.
- Backend FastAPI: `https://scam-project-backend.vercel.app`.
- Hosting frontend: Netlify.

## Menjalankan

Gunakan Node.js 22 sesuai konfigurasi Netlify, beserta npm. Jalankan perintah berikut dari folder proyek:

```bash
npm install
npm run dev
```

Buka **http://localhost:5173**. Vite menggunakan host `localhost` dan port tetap `5173`. Backend Vercel sudah menjadi konfigurasi default, sehingga tidak perlu menjalankan backend lokal. Untuk melihat contoh hasil ancaman secara langsung, buka `http://localhost:5173/?demo=threat` atau tambahkan query berikut:

```text
?demo=threat
```

Build produksi:

```bash
npm run build
```

Hasil build berada di `dist/`. Untuk memeriksanya secara lokal, hentikan dev server terlebih dahulu, lalu jalankan `npm run preview`; keduanya memakai port `5173`. Edit kode di `src/`, aset di `public/`, dan HTML utama di `index.html`, bukan file hasil build di `dist/`.

## Fitur

- Deteksi tautan dan pesan dapat dicoba sebagai tamu tanpa login. Batas percobaan ditentukan backend; frontend tidak menetapkan jumlah kuota sendiri.
- Respons error `guest_limit_reached` menampilkan pemberitahuan dengan tombol Masuk dan Daftar. Input tetap berada di halaman; setelah login, pengguna dapat menekan Periksa lagi. Error 429 umum tetap ditampilkan sebagai pembatasan laju, bukan batas tamu.
- Komponen React dengan state UI terkelola
- Styling responsif menggunakan Tailwind CSS v4
- Pemindai URL dan isi pesan melalui model backend; aturan heuristik lokal hanya untuk simulasi
- Pratinjau screenshot melalui pemilih file atau drag-and-drop; analisis gambar di UI masih berupa simulasi fitur mendatang
- Preview lokal, validasi PNG/JPG/WebP, dan batas ukuran 4 MB
- Hasil klasifikasi, rincian sinyal, dan rekomendasi tindakan
- Contoh simulasi URL, pesan, dan gambar yang dapat dicoba tanpa login; hasil diberi label simulasi dan tidak dikirim ke backend
- Navigasi responsif dan menu mobile
- Penanda navigasi aktif mengikuti posisi halaman
- Desain gelap dengan aksen cyan, tipografi Plus Jakarta Sans, Space Grotesk, dan JetBrains Mono
- Radar animasi dengan sapuan cahaya, sinyal berdenyut, kontrol jeda, serta dukungan reduced motion; loading state dan toast untuk pemeriksaan
- Mode demo tidak mengirim data keluar dari browser
- Panduan tiga langkah, penjelasan skor, salin ringkasan, catatan edukasi, dan FAQ yang seluruhnya tertutup saat halaman pertama dibuka
- Favicon perisai Sentry dan footer responsif dengan `max-width` serta teks yang dapat membungkus
- Login, registrasi, verifikasi, pemulihan kata sandi, dan panel riwayat pemeriksaan

## Pemeriksaan UI lokal

Untuk menguji alur guest secara terisolasi, gunakan `node scripts/review-guest.mjs` dengan Vite pada `http://localhost:5173` dan Edge pengujian pada debugging port `9225`. Script mengganti seluruh respons API sebelum halaman dimuat: tidak memakai kuota backend, membuat akun, atau mengirim email. Pengujian mencakup analisis tamu, 429 biasa, alert batas guest, pilihan daftar, input yang tetap tersimpan, dan analisis setelah login tiruan. Bukti pengujian tersedia pada `artifacts/guest-review.json` dan `artifacts/guest-limit.png`.

Folder `artifacts/` menampung screenshot dan laporan hasil pengujian lokal; folder ini dapat tidak tersedia pada clone baru karena tidak disertakan dalam Git. Hasil pengujian dengan respons tiruan tidak membuktikan model dan autentikasi backend produksi berfungsi.

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

Restart Vite setelah mengubah environment. Di PowerShell yang memblokir `npm.ps1`, gunakan `npm.cmd run dev`. Port 5173 dikunci agar alamat pengembangan konsisten. Jika port terpakai, gunakan server yang sedang aktif atau hentikan server proyek tersebut dengan `Ctrl+C` di terminalnya sebelum menjalankan ulang.

### Jalur proxy API

Dengan konfigurasi default, `apiClient.js` mengirim request browser ke `/api-proxy/...` pada origin frontend. Vite (`vite.config.js`) meneruskannya ke backend saat pengembangan/preview, sedangkan Netlify menggunakan aturan di `public/_redirects` dan `netlify.toml`. Aturan proxy harus berada sebelum fallback `/*` agar permintaan API tidak menerima HTML aplikasi.

Proxy mengatasi kebutuhan request lintas-origin dari browser, tetapi tidak memperbaiki error model, database, autentikasi, atau kuota di backend. Jika mengganti domain, tinjau juga header `Origin` yang dikonfigurasi pada proxy Vite; jangan menganggap penggantian link README otomatis mengubah konfigurasi tersebut.

Jika ingin menggunakan backend lokal, ganti `VITE_API_BASE_URL` menjadi `http://localhost:8000` dan izinkan origin frontend tersebut pada CORS backend. Jangan menyimpan password, token, atau rahasia pada variabel `VITE_*`; nilainya dapat dilihat publik di bundle frontend.

### Akses tamu dan akun

Frontend mengizinkan deteksi URL dan pesan tanpa Bearer token. Backend tetap menentukan apakah masing-masing endpoint mendukung guest dan berapa banyak percobaan yang tersedia. Setelah backend mengirim kode `guest_limit_reached`, pengguna diminta masuk atau daftar. Frontend tidak membuat kuota sendiri atau mengganti hasil gagal dengan hasil simulasi.

Alur akun yang digunakan:

1. Register melalui `POST /auth/register`.
2. Verifikasi email melalui `POST /auth/verify-otp`.
3. Login melalui `POST /auth/login`.
4. Pemulihan akun memakai `POST /auth/forgot-password` dan `POST /auth/reset-password`.
5. Access token dikirim sebagai header Bearer dan disimpan di memori halaman. Saat halaman dimuat ulang, frontend mencoba memulihkan sesi memakai cookie refresh token; gunakan tombol Keluar untuk mengakhiri sesi.
6. Keluar akun membersihkan access token di frontend dan memanggil `POST /auth/logout` untuk meminta backend menghapus cookie sesi. Kegagalan logout server ditampilkan dengan opsi mencoba lagi.

Semua request menggunakan `credentials: include`. Frontend memakai `/auth/refresh` untuk memulihkan sesi dan mengulang permintaan terautentikasi yang menerima 401 sebanyak satu kali. Permintaan refresh bersamaan digabungkan. Jika refresh gagal, pengguna perlu masuk kembali. Cookie lintas situs bergantung pada pengaturan backend dan kebijakan browser.

### Kontrak deteksi

- URL: `POST /detection/url` dengan JSON `{ "url": "https://..." }`, mengikuti penambahan endpoint pada kode integrasi terbaru.
- Pesan: `POST /detection/text` dengan JSON `{ "text": "..." }`.
- Screenshot: layanan API menyediakan `POST /detection/image` dengan multipart field `file`, tetapi tab screenshot pada UI saat ini hanya menjalankan simulasi.
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

> Tab screenshot saat ini tetap berupa simulasi fitur mendatang, sesuai desain yang ada; perubahan akses tamu hanya mengaktifkan deteksi nyata pada tab tautan dan pesan. Frontend tidak menganggap hasil simulasi sebagai hasil model asli.

> Pemilihan screenshot dibatasi 4 MB dengan format PNG, JPG, atau WebP. Screenshot yang lebih besar perlu diperkecil terlebih dahulu.

## Deployment frontend dan CORS

### Netlify

Frontend produksi: **[Sentry — Deteksi Phishing & Spam](https://sentry-phishing-scam.netlify.app/)**.

Origin produksi yang digunakan untuk pengaturan backend adalah `https://sentry-phishing-scam.netlify.app` (tanpa slash di akhir).

Konfigurasi `netlify.toml` menyediakan build command, folder publikasi `dist`, environment API, proxy backend, dan fallback React. Hanya isi `dist` yang dipublikasikan sebagai aset website, bukan `.env.local` atau seluruh repository. Konfigurasi `vercel.json` tidak dipakai oleh Netlify.

Untuk deployment melalui terminal Windows:

```powershell
netlify.cmd login
netlify.cmd link
netlify.cmd deploy --prod
```

Saat menjalankan `link`, pilih project yang menyajikan `sentry-phishing-scam.netlify.app`. Jika folder sudah ditautkan ke project yang benar, langkah `link` tidak perlu diulang. Perintah deploy akan menjalankan build sebelum mengunggah hasilnya. Auto-deploy setiap push memerlukan koneksi repository GitHub yang dikonfigurasi terpisah pada Netlify. Jangan mengirim token login ke chat atau menyimpannya di repository.

### Pengaturan hosting dan backend

1. Pada hosting frontend, set `VITE_API_BASE_URL=https://scam-project-backend.vercel.app`, `VITE_API_ENABLED=true`, dan `VITE_API_TIMEOUT_MS=60000`.
2. Gunakan build command `npm run build` dan output directory `dist`. Environment Vite dibaca saat build, jadi lakukan rebuild/redeploy setiap kali nilainya berubah.
3. Pastikan `/api-proxy/*` diteruskan ke backend, bukan ke `index.html`. Jika memilih akses API langsung lintas-origin, minta pengembang backend mengizinkan origin `https://sentry-phishing-scam.netlify.app`, credentials, serta header `Content-Type` dan `Authorization`; jangan gunakan wildcard `*` untuk credentialed requests.
4. Pastikan metode `GET`, `POST`, `DELETE`, dan preflight `OPTIONS` sesuai kebutuhan. Periksa cookie sesi dari domain produksi, termasuk pengaturan `Secure`, `SameSite`, `Domain`, dan `Path` pada backend, terutama bila memakai proxy.
5. Buka frontend dan pastikan status pemindai menampilkan **Layanan terhubung**. Jika belum, klik **Cek ulang koneksi** dan periksa respons request/preflight pada DevTools Network. Keberhasilan health check tidak menjamin model, database, dan layanan email semuanya sehat.
6. Uji registrasi/verifikasi akun, login, analisis URL dan teks (guest maupun akun), alert batas guest, pratinjau/simulasi screenshot, riwayat, serta logout dengan akun uji sendiri sebelum rilis.

## Kendala umum

| Gejala | Pemeriksaan yang disarankan |
| --- | --- |
| `Port 5173 is already in use` | Gunakan server proyek yang sudah berjalan atau hentikan dengan `Ctrl+C` sebelum menjalankan ulang. |
| Layanan terhubung, tetapi deteksi gagal | Status hanya memeriksa `/health`. Periksa respons `/detection/text` atau `/detection/url` pada DevTools Network. |
| `401 Not authenticated` pada guest | Pastikan endpoint tersebut mendukung guest di backend. Ini berbeda dari `guest_limit_reached`. |
| `guest_limit_reached` | Masuk atau daftar, lalu tekan Periksa kembali; input tetap berada di halaman. |
| HTTP 500 | Periksa runtime log backend untuk menemukan exception; frontend tidak dapat memperbaiki kegagalan internal backend. |
| Respons API berupa HTML | Periksa urutan proxy dan fallback Netlify serta nilai base URL. |
