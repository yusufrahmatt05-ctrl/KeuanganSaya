# Keuangan Saya PWA

PWA pencatatan gaji, bonus, pemasukan, pengeluaran, dan tabungan/investasi.

## Logika saldo versi 6
- Pemasukan hanya tercatat di bagian Pemasukan dan **tidak menambah tabungan otomatis**.
- Pengeluaran tetap tercatat penuh di bagian Pengeluaran dan **mengurangi Total Tabungan**.
- Tabungan/investasi hanya menambah Total Tabungan ketika nominal dimasukkan manual.
- Pengeluaran tetap ditampilkan penuh pada bulan/tanggal transaksi; angka Pemasukan tidak dikurangi.
- Total Tabungan = saldo awal + tabungan manual baru - pengeluaran baru.
- Filter bulan/tahun menggunakan tanggal kalender yang dinormalisasi, sehingga daftar transaksi dan kartu ringkasan memakai data bulan yang sama.
- Setelah menambah pengeluaran/tabungan, aplikasi otomatis memilih bulan transaksi.
- Data lama dan saldo tabungan yang sudah ada dipertahankan.

## Cache
Service worker dinaikkan ke v6 agar PWA mengambil kode terbaru setelah deployment.
