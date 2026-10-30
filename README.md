# Nurul Ibadah — Aplikasi Web Pengingat & Evaluasi Ibadah Harian

> Aplikasi web full-stack modern berbasis arsitektur decoupled (**Frontend Statis di GitHub Pages** + **REST API Google Apps Script & Google Sheets**) dengan tema sejuk Islami (*Emerald Oasis*) dan mode malam (*Deep Nightfall Tahajud*).

---

## 📁 Struktur Direktori Proyek

```text
nurul-ibadah/
├── index.html            # Antarmuka SPA lengkap (Beranda, Mutaba'ah, Evaluasi, Rapor A4, Pengaturan)
├── css/
│   └── style.css         # Font Amiri & Plus Jakarta Sans, print engine A4, tema visual
├── js/
│   ├── config.js         # Konfigurasi URL Google Apps Script & data cadangan
│   └── app.js            # Engine countdown salat, checklist mutaba'ah, Chart.js, & sync GAS
└── backend/
    ├── Kode.gs           # REST API JSON murni + Script Properties + CacheX + Auto-Setup
    ├── Migrasi.gs        # Utilitas migrasi & sinkronisasi data antar-spreadsheet yang aman
    └── appsscript.json   # Manifest konfigurasi runtime Google Apps Script
```

---

## 🚀 Langkah 1: Setup Backend Google Apps Script (Hanya Sekali)

1. Buka [Google Apps Script Dashboard](https://script.google.com/home).
2. Klik **Proyek Baru** (New Project), beri nama proyek: `Nurul Ibadah Backend API`.
3. Di editor Apps Script:
   - Salin seluruh isi file [`backend/Kode.gs`](backend/Kode.gs) dan tempel ke file `Kode.gs` di editor.
   - Buat file script baru bernama `Migrasi.gs`, lalu salin seluruh isi file [`backend/Migrasi.gs`](backend/Migrasi.gs) ke dalamnya.
   - Buka **Project Settings** (ikon gerigi) → centang **Show "appsscript.json" manifest file in editor**.
   - Buka file `appsscript.json` di editor, ganti isinya dengan file [`backend/appsscript.json`](backend/appsscript.json).
4. **Jalankan Fungsi Setup:**
   - Di bilah fungsi editor atas, pilih fungsi `setupAppEnvironment`.
   - Klik **Run** (Jalankan) dan berikan izin akses Google Drive & Google Sheets yang diminta.
   - Script akan otomatis membuat folder Google Drive `📁 Nurul Ibadah`, membuat spreadsheet database `🗃️ Database — Nurul Ibadah`, mengisi data hadis harian, data dummy 30 hari untuk grafik, dan mengamankan properti di **Script Properties**.
5. **Deploy sebagai Web App REST API:**
   - Klik tombol **Deploy** (Terapkan) di kanan atas → **New deployment** (Penerapan baru).
   - Klik ikon gerigi pilih jenis **Web app** (Aplikasi Web).
   - Isi Deskripsi: `v1.0.0 Production`.
   - **Execute as (Jalankan sebagai):** `Me` (Saya).
   - **Who has access (Yang memiliki akses):** `Anyone` (Siapa saja).
   - Klik **Deploy**.
   - Salin **Web App URL** yang dihasilkan (berakhiran `/exec`).
6. Buka file [`js/config.js`](js/config.js) di komputer Anda, lalu tempel URL tersebut pada baris:
   ```javascript
   GAS_URL: 'https://script.google.com/macros/s/AKfycbx.../exec',
   ```

---

## 🌐 Langkah 2: Deploy Frontend ke GitHub Pages (Terminal)

Ikuti panduan ramah pemula berikut untuk menerbitkan frontend ke GitHub Pages:

### 1. Navigasi ke Folder Proyek di Terminal
Buka PowerShell atau Git Bash, lalu masuk ke folder `nurul-ibadah`:
```bash
cd "d:\Marskal Edi's File\Marskal's Project\webapp\Google script ft antigravity modul 4\nurul-ibadah"
```

### 2. Inisialisasi Git & Commit Pertama
```bash
git init
git add .
git commit -m "Initial commit Nurul Ibadah Full-Stack App"
git branch -M main
```

### 3. Hubungkan ke Repositori GitHub Anda
*(Pastikan Anda telah membuat repositori kosong di GitHub bernama `nurul-ibadah` bertipe **Public** tanpa centang README)*
```bash
git remote add origin https://github.com/USERNAME/nurul-ibadah.git
git push -u origin main
```
> **Catatan Autentikasi:** Saat terminal meminta password GitHub, masukkan **Personal Access Token (PAT)** Anda (yang diawali `ghp_...`), bukan password akun.

### 4. Aktifkan Fitur GitHub Pages
1. Di halaman repositori GitHub Anda, buka tab **Settings** → menu **Pages** di bilah kiri.
2. Pada bagian **Build and deployment**:
   - **Source:** `Deploy from a branch`
   - **Branch:** Pilih `main` dan folder `/ (root)`
   - Klik **Save**.
3. Centang opsi **Enforce HTTPS**.
4. Tunggu 1–2 menit, refresh halaman hingga muncul tautan hijau:  
   `Your site is live at https://USERNAME.github.io/nurul-ibadah/`

---

## ✨ Fitur-Fitur Unggulan

1. **Jadwal Salat & Hitung Mundur Real-Time:** Menghitung waktu salat 5 waktu secara presisi dengan visualisasi waktu aktif (*Segera Masuk*) dan timer mundur (*hh:mm:ss*).
2. **Kompas Kiblat & Audio Adzan Chime:** Visualisasi arah Ka'bah (295° Barat Laut) dan tombol adzan dengan Web Audio API sintetis tanpa dependensi file eksternal.
3. **Mutaba'ah Harian 1-Klik:** Checklist salat fardhu dengan sakelar berjamaah di masjid, stepper rakaat sunnah (Dhuha, Tahajud, Rawatib, Witir), stepper tilawah Al-Qur'an (halaman & juz), dan catatan muhasabah diri.
4. **Grafik Evaluasi & Peta Panas Konsistensi:** Grafik kurva 30 hari Chart.js dengan garis ambang target 80%, donut chart ketepatan waktu, dan kalender heatmap 7x5.
5. **Rapor Formal Cetak & PDF A4 Ber-QR HMAC:** Format resmi sertifikat A4 dengan tanda tangan digital, stempel predikat (*Mumtaz*), dan QR code verifikasi HMAC anti-pemalsuan.
6. **Dua Mode Visual:** *Emerald Oasis* (siang hari yang teduh) dan *Deep Nightfall Tahajud* (mode gelap pekat tanpa silau untuk qiyamullail).
7. **Offline-First & Anti-Lag:** Bekerja instan dengan penyimpanan `localStorage` lokal dan tersinkronisasi otomatis ke Google Sheets melalui teknik CORS-safe fetch `text/plain`.
