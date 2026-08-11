# Keuangan Saya PWA

PWA pencatatan gaji, bonus, pemasukan, pengeluaran, dan tabungan/investasi.

## Logika saldo versi 5
- Pemasukan hanya tercatat di bagian Pemasukan dan **tidak** menambah tabungan otomatis.
- Pengeluaran tetap tercatat penuh di bagian Pengeluaran dan **mengurangi Total Tabungan**.
- Tabungan/investasi hanya menambah Total Tabungan ketika nominal dimasukkan secara manual di bagian Tabungan / Investasi.
- Tabungan bulan ini, grafik tabungan, dan ringkasan tahunan menampilkan **tabungan manual**, bukan selisih pemasukan dikurangi pengeluaran.
- Rumus saldo: **Total Tabungan = saldo awal + tabungan manual baru - pengeluaran baru**.
- Saat upgrade dari versi sebelumnya, saldo tabungan yang sedang tampil dipertahankan agar data lama tidak berubah.
