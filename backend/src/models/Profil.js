import AppError from '../utils/AppError.js';

// Aturan data profil yang boleh diubah sendiri oleh pengguna: username, alamat, foto.
export default class Profil {
  static MAKS_FOTO_BYTE = 200 * 1024; // setelah di-decode (frontend mengirim JPEG persegi ± 30-80 KB)
  static ROLE_BERALAMAT = ['CUSTOMER', 'ADMIN'];

  // Mengembalikan username yang sudah dinormalisasi (huruf kecil, tanpa spasi di ujung)
  static validasiUsername(nilai) {
    const u = typeof nilai === 'string' ? nilai.trim().toLowerCase() : nilai;
    if (typeof u !== 'string' || !/^[a-z0-9_.]{4,50}$/.test(u)) {
      throw new AppError('username harus 4-50 karakter (huruf, angka, titik, atau underscore)');
    }
    if (/^[._]|[._]$/.test(u)) throw new AppError('username tidak boleh diawali atau diakhiri titik atau underscore');
    if (/[._]{2,}/.test(u)) throw new AppError('username tidak boleh memuat dua titik/underscore berurutan');
    if (/^[0-9_.]+$/.test(u)) throw new AppError('username harus memuat minimal satu huruf');
    return u;
  }

  // Mengembalikan alamat (string) atau null jika dikosongkan
  static validasiAlamat(nilai) {
    if (nilai === null) return null;
    if (typeof nilai !== 'string') throw new AppError('alamat harus berupa teks');
    const t = nilai.trim();
    if (t === '') return null;
    if (t.length < 10) throw new AppError('alamat terlalu singkat (minimal 10 karakter atau kosongkan)');
    if (t.length > 255) throw new AppError('alamat maksimal 255 karakter');
    return t;
  }

  // Aturan password baru (sama dengan aturan registrasi di frontend, kecuali daftar password umum).
  // Mengembalikan password jika valid; melempar AppError berisi semua alasan jika tidak.
  static validasiPasswordBaru(nilai, username = '') {
    if (typeof nilai !== 'string' || nilai === '') throw new AppError('password_baru wajib diisi');

    const alasan = [];
    const panjang = [...nilai].length;
    if (/\s/.test(nilai)) alasan.push('tidak boleh mengandung spasi');
    if (panjang < 8) alasan.push(`terlalu pendek (${panjang} karakter, minimal 8)`);
    if (Buffer.byteLength(nilai, 'utf8') > 72) alasan.push('terlalu panjang (maksimal 72 karakter)');
    if (!/[a-z]/.test(nilai)) alasan.push('harus memuat huruf kecil');
    if (!/[A-Z]/.test(nilai)) alasan.push('harus memuat huruf kapital');
    if (!/[0-9]/.test(nilai)) alasan.push('harus memuat angka');
    if (!/[^A-Za-z0-9\s]/.test(nilai)) alasan.push('harus memuat simbol');
    if (/(.)\1{3,}/u.test(nilai)) alasan.push('tidak boleh memuat karakter yang sama berulang 4 kali atau lebih');
    const u = String(username ?? '').trim().toLowerCase();
    if (u.length >= 4 && nilai.toLowerCase().includes(u)) alasan.push('tidak boleh mengandung username');

    if (alasan.length) throw new AppError(`Password baru tidak memenuhi syarat: ${alasan.join('; ')}.`);
    return nilai;
  }

  // null / '' = hapus foto. Selain itu harus data URL gambar yang isinya benar-benar gambar.
  static validasiFoto(nilai) {
    if (nilai === null || nilai === '') return null;
    if (typeof nilai !== 'string') throw new AppError('foto_profil harus berupa data URL gambar atau null');

    const cocok = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(nilai);
    if (!cocok) throw new AppError('foto_profil harus berupa foto JPG, PNG, atau WEBP (data URL base64)');

    const [, jenis, base64] = cocok;
    const data = Buffer.from(base64, 'base64');
    if (data.length === 0) throw new AppError('foto_profil kosong');
    if (data.length > Profil.MAKS_FOTO_BYTE) throw new AppError('Foto profil terlalu besar (maksimal 200 KB)');
    if (!Profil.#cocokDenganJenis(data, jenis)) throw new AppError('Isi file bukan foto yang valid');
    return nilai;
  }

  static #cocokDenganJenis(b, jenis) {
    if (jenis === 'jpeg') return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    if (jenis === 'png') {
      return b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
    return b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';
  }
}
