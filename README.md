# Cek Kesehatan Kas — UMKM Liquidity Risk Classifier

Prototipe Tugas Akhir STI ITB 2025 — dashboard berbasis HTML/React untuk memprediksi risiko likuiditas usaha UMKM.

Aplikasi ini sepenuhnya **static HTML** (React + Babel + Plotly di-load via CDN). Cukup buka `index.html` di browser — tidak perlu server, tidak perlu build step.

---

## 🚀 Deployment (Automated with GitHub Pages + Actions)

**Status:** ✅ Already configured and live!

Repository ini sudah siap deploy dengan GitHub Actions automation:
- Setiap kali ada `push` ke branch `main`, GitHub Actions otomatis mem-build dan men-deploy ke GitHub Pages
- Tidak perlu manual trigger — deployment berjalan in-background

**URL deployment:**
```
https://dedysaragih123.github.io/KlasifikasiUMKM/
```

**Cara kerja:**
1. Edit file (`.jsx` atau `index.html`)
2. Commit & push ke branch `main`
3. GitHub Actions (workflow `.github/workflows/deploy.yml`) otomatis menjalankan deploy
4. Tunggu ~2-5 menit, situs akan ter-update otomatis

**Monitoring deployment:**
- Buka tab **Actions** di repo GitHub
- Lihat status workflow terbaru — icon ✅ = deploy berhasil, ❌ = ada error

> ⚠️ **Catatan:** Koneksi internet tetap diperlukan saat membuka situs — React, Babel, dan Plotly dimuat dari CDN (unpkg & cdn.plot.ly). Bila ingin sepenuhnya offline, bundle semua dependensi ke 1 file HTML standalone.

---

## 📁 Struktur Project

```
index.html              ← file utama (sudah berisi seluruh kode inline)
sidebar.jsx             ← komponen sidebar (sumber, di-inline ke index.html)
app.jsx                 ← root React component (sumber)
data.js                 ← mock data hasil eksperimen tesis (sumber)
styles.css              ← design system tokens (sumber)
pages/
  ├── landing.jsx       ← halaman Beranda
  ├── input.jsx         ← wizard prediksi 4 langkah
  ├── results.jsx       ← laporan hasil prediksi
  ├── detail.jsx        ← analisis mendalam
  └── research.jsx      ← halaman "Tentang Sistem"
README.md
```

File `.jsx` di folder `pages/` dan root adalah **sumber kebenaran** untuk pengembangan. `index.html` adalah hasil bundle — semua kode dari file-file `.jsx` sudah di-inline ke dalamnya supaya tidak ada masalah CORS saat dibuka langsung dari filesystem.

**Penting:** GitHub Pages serve `index.html` saja. File `.jsx` terpisah tidak dipakai saat runtime — mereka hanya untuk editing.

---

## 🛠️ Edit & Rebuild

Bila ingin mengubah sebuah halaman:

1. Edit file sumber di `pages/<nama>.jsx` (atau `sidebar.jsx`)
2. Temukan blok kode terkait di `index.html` (cari komentar `// Halaman ...`)
3. Salin isi file `.jsx` baru ke blok tersebut, ganti yang lama
4. Commit & push ke GitHub — GitHub Pages akan auto-deploy ulang

Atau cukup edit `index.html` langsung bila tidak ingin mempertahankan file sumber terpisah.

---

## 🎯 Fitur Utama

- **Wizard prediksi 4 langkah** — copywriting ramah pemilik UMKM, tanpa istilah teknis
- **Auto-threshold & auto-macro** — semua parameter sensitif disetel otomatis berdasarkan tuning hasil tesis
- **Privacy-safe peer comparison** — sebaran skor anonim (histogram), tidak menampilkan nama usaha lain
- **Detail teknis tersembunyi** — chart benchmark akademik tetap tersedia di balik section collapsible "Detail untuk Peneliti", agar tidak membingungkan pengguna awam

---

## 📊 Sumber Data & Model

- Periode data: Januari 2023 – Februari 2025
- Sumber: PT XYZ (anonim) — dataset internal Tugas Akhir
- Train/Val/Test split: 70/15/15
- Model: ensemble (Stacking H=4, Soft Voting H=12, LightGBM DART H=24)
- Threshold τ\* dipilih per horizon dari hasil tuning di test set

Detail teknis lengkap ada di halaman **Tentang Sistem → Detail Teknis untuk Peneliti**.

---

## 📝 Lisensi & Disclaimer

Prototipe akademik. Hasil prediksi bersifat indikatif dan **tidak boleh** digunakan sebagai dasar tunggal keputusan keuangan resmi.

© 2025 Dedy Hofmanindo Saragih · NIM 18222085 · STI ITB
Pembimbing: Ir. Windy Gambetta, M.B.A.
