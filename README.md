# Data Keuangan HAPIA Jember

Situs statis (tanpa build) — semua angka dihitung langsung dari `data/Data_Keuangan.xlsx`.

## Cara mengubah data (paling mudah)
1. Edit file Excel seperti biasa (sheet **Pengaturan, Transaksi, Anggaran, Event**), simpan.
2. Di GitHub: buka folder `data/` → **Add file → Upload files** → seret file Excel dengan nama yang sama `Data_Keuangan.xlsx` → **Commit**.
3. Vercel otomatis deploy ulang (±30 detik). Selesai.

Ingin melihat hasil sebelum di-commit? Klik **📂 Pratinjau Excel** di situs untuk memuat file Excel dari komputer (tidak disimpan).

## Deploy
1. Buat repo GitHub baru, unggah seluruh isi folder ini.
2. vercel.com → **Add New Project** → pilih repo → Framework: **Other** → **Deploy**.

## Catatan
- Jangan ubah nama sheet & posisi kolom/judul tabel di Excel.
- Tombol **Unduh PDF Laporan** membuat laporan lengkap + kolom tanda tangan.
- File Excel ikut terpublikasi. Untuk data sensitif, aktifkan Password Protection di Vercel.
