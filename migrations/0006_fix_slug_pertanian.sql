-- Perbaikan: slug program Pertanian ternyata ke-generate otomatis jadi
-- "pertanian-ketahanan-pangan" (dari nama lengkap), bukan "pertanian" seperti
-- diasumsikan migrasi 0005 kemarin — makanya /program/pertanian nggak ketemu.
-- Di sini disamain jadi "pertanian" (biar cocok sama folder gambar yang ada),
-- href_custom dikosongin biar ngarah ke halaman detail generik, dan konten
-- ditimpa ulang pakai isi migrasi yang benar (menimpa isian percobaan kalau ada).
UPDATE program
SET
  slug = 'pertanian',
  href_custom = NULL,
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
<img src="/images/galeri/kebun-thoyyibah.jpg" alt="Kebun Tanaman Thoyyibah" />'
WHERE id = 2;
