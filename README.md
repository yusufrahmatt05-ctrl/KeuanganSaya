# Keuangan Saya PWA

PWA pencatatan gaji, bonus, pemasukan, pengeluaran, tabungan/investasi.

## Logika saldo otomatis
- Saldo awal tabungan memakai `keuanganYusufSavingsBase` yang sudah tersimpan.
- Pemasukan baru menambah saldo.
- Pengeluaran baru mengurangi saldo.
- Tabungan/investasi manual baru menambah saldo.
- Laporan pemasukan dan pengeluaran tetap menampilkan angka transaksi masing-masing; tidak dikurangi atau diubah.
- Transaksi lama yang sudah ada sebelum sistem saldo otomatis tidak dihitung ulang.
