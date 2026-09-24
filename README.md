# Aplikasi Grosir

Aplikasi kasir grosir dengan React dan Node.js.

## Menjalankan aplikasi

1. Pastikan MySQL aktif dan database `grosir_db` tersedia.
2. Salin `.env.example` menjadi `.env`, lalu sesuaikan konfigurasi database.
3. Pasang dependency:

```bash
npm install
```

Jalankan server API dan frontend production:

```bash
npm run build
npm run server
```

Buka `http://localhost:3000`.

Untuk mode desktop:

```bash
npm run desktop
```

## API

Express menyediakan endpoint `/api` untuk dashboard, barang, dan transaksi. React menggunakan endpoint yang sama, sehingga perubahan stok dan riwayat transaksi tetap berjalan seperti sebelumnya.
