import AppError from './AppError.js';

/**
 * Membatasi percobaan password yang salah (mencegah tebak-tebakan password lama
 * oleh orang yang memegang token). Disimpan di memori server: hilang saat server restart,
 * dan tidak dibagi antar-instance (cukup untuk satu server).
 */
export default class PembatasPercobaan {
  #catatan = new Map(); // kunci -> { gagal, mulai, terkunciSampai }

  constructor({ maksGagal = 5, jendelaMs = 15 * 60 * 1000, kunciMs = 15 * 60 * 1000, sekarang = () => Date.now() } = {}) {
    this.maksGagal = maksGagal;
    this.jendelaMs = jendelaMs;
    this.kunciMs = kunciMs;
    this.sekarang = sekarang;
  }

  // Melempar 429 jika kunci sedang terkunci
  periksa(kunci) {
    const c = this.#catatan.get(kunci);
    if (!c) return;
    const kini = this.sekarang();
    if (c.terkunciSampai && kini < c.terkunciSampai) {
      const menit = Math.max(1, Math.ceil((c.terkunciSampai - kini) / 60000));
      throw new AppError(`Terlalu banyak percobaan password yang salah. Coba lagi dalam ${menit} menit.`, 429);
    }
    if (c.terkunciSampai || kini - c.mulai > this.jendelaMs) this.#catatan.delete(kunci);
  }

  catatGagal(kunci) {
    const kini = this.sekarang();
    let c = this.#catatan.get(kunci);
    if (!c || kini - c.mulai > this.jendelaMs) c = { gagal: 0, mulai: kini, terkunciSampai: null };
    c.gagal += 1;
    if (c.gagal >= this.maksGagal) c.terkunciSampai = kini + this.kunciMs;
    this.#catatan.set(kunci, c);
    if (this.#catatan.size > 1000) this.#bersihkan(kini);
  }

  reset(kunci) {
    this.#catatan.delete(kunci);
  }

  #bersihkan(kini) {
    for (const [k, c] of this.#catatan) {
      if ((c.terkunciSampai ?? c.mulai + this.jendelaMs) < kini) this.#catatan.delete(k);
    }
  }
}
