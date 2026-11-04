# KeuanganSaya v8 (multi-year)

- Mempertahankan tampilan dasar v7 Tabungan Pribadi.
- Memuat backup transaksi 2026 dari `data-2026.json` hanya saat localStorage aplikasi belum memiliki data.
- Pilihan tahun otomatis menampilkan tahun transaksi; 2026 dan 2027 tersedia.
- Saldo awal 2027 mengikuti saldo akhir 2026 berdasarkan transaksi tabungan dan pengeluaran.
- Pemasukan tidak otomatis menambah tabungan.
- Tambah, edit, hapus transaksi; export dan import backup JSON.

## Upload ke GitHub Pages
Upload seluruh isi ZIP ke repository yang sama, replace file website, lalu tunggu GitHub Pages selesai deploy. Jangan hapus data Safari/localStorage. Jika data lama sudah tersimpan di perangkat, aplikasi akan mempertahankannya; gunakan Import Backup JSON bila perlu memasukkan backup 2026. Duplikasi ID akan dilewati.
