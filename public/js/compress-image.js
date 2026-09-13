/**
 * Compress & convert gambar jadi JPEG langsung di browser, sebelum diupload ke server.
 * Dipakai di semua form admin (Berita, Program, Galeri) biar file yang nyampe ke R2
 * udah kecil & format-nya konsisten, nggak perlu proses tambahan di server.
 *
 * Dipasang sebagai script biasa (bukan module), jadi fungsinya nempel ke window.
 *
 * @param {File} file - file gambar asli dari input
 * @param {number} [maxDimension=1600] - lebar/tinggi maksimum, sisi lain menyesuaikan proporsi
 * @param {number} [quality=0.82] - kualitas JPEG (0-1)
 * @returns {Promise<File>} file JPEG hasil compress, siap dipakai gantiin file asli
 */
window.compressToJpeg = function (file, maxDimension, quality) {
  maxDimension = maxDimension || 1600;
  quality = quality || 0.82;

  // GIF dilewatin apa adanya (khawatir animasinya ilang kalau di-convert ke JPEG)
  if (file.type === "image/gif") {
    return Promise.resolve(file);
  }

  return new Promise(function (resolve, reject) {
    var objectUrl = URL.createObjectURL(file);
    var img = new Image();

    img.onload = function () {
      URL.revokeObjectURL(objectUrl);

      var width = img.width;
      var height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      var canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas tidak didukung, pakai file asli"));
        return;
      }

      // Latar putih dulu, biar PNG transparan nggak jadi hitam pas di-convert ke JPEG
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        function (blob) {
          if (!blob) {
            reject(new Error("Gagal memproses gambar"));
            return;
          }
          var newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
          var compressedFile = new File([blob], newName, { type: "image/jpeg" });
          resolve(compressedFile);
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      // Kalau gagal diproses (format aneh dll), pakai file asli aja daripada gagal total
      resolve(file);
    };

    img.src = objectUrl;
  });
};
