-- Tambah kolom konten (rich text, hasil editor Quill) ke tabel program.
-- Dipakai untuk render halaman detail generik /program/[slug].
ALTER TABLE program ADD COLUMN konten TEXT;

-- Migrasi isi halaman custom Pertanian (3 paragraf + galeri 5 foto) yang lama
-- ke kolom konten, supaya kontennya nggak hilang setelah halaman custom dihapus.
-- href_custom dikosongkan supaya kartunya sekarang ngarah ke halaman detail
-- generik /program/pertanian (dirender dari database), bukan lagi ke file statis lama.
UPDATE program
SET
  konten = '<h2>Tentang Program</h2>
<p>Program Pertanian & Ketahanan Pangan merupakan inisiatif terbaru Yasuki yang mengelola lahan pertanian produktif untuk membangun kemandirian pangan yayasan sekaligus masyarakat sekitar. Berbagai sayuran ditanam dan dirawat secara organik, mulai dari pakcoy hingga sayuran daun lainnya.</p>
<h2>Melibatkan Anak Binaan</h2>
<p>Anak-anak binaan Yasuki turut dilibatkan dalam proses bercocok tanam hingga panen, sebagai bagian dari pembelajaran hidup mandiri dan kecintaan terhadap alam. Hasil panen turut dinikmati bersama sebagai bagian dari kebutuhan pangan sehari-hari.</p>
<h2>Sayuran Organik Yasuki</h2>
<p>Sebagian hasil panen dikemas dan dipasarkan dengan label "Sayuran Organik" hasil pertanian binaan Yasuki di wilayah Purworejo — mendukung keberlanjutan program sekaligus membuka peluang pemberdayaan ekonomi bagi warga sekitar.</p>
<h2>Dokumentasi Lapangan</h2>
<img src="/images/program/pertanian/lahan-pertanian.jpg" alt="Lahan pertanian Yasuki saat pagi hari" />
<img src="/images/program/pertanian/petani-panen.jpg" alt="Petani memanen hasil kebun" />
<img src="/images/program/pertanian/panen-anak-binaan.jpg" alt="Anak binaan Yasuki membawa hasil panen sayur" />
<img src="/images/program/pertanian/sayuran-organik.jpg" alt="Sayuran organik hasil panen dikemas untuk dipasarkan" />
<img src="/images/galeri/kebun-thoyyibah.jpg" alt="Kebun Tanaman Thoyyibah" />',
  href_custom = NULL
WHERE slug = 'pertanian';
