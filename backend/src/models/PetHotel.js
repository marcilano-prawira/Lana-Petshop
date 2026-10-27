import AppError from '../utils/AppError.js';

const MS_PER_HARI = 24 * 60 * 60 * 1000;

const keTanggal = (nilai) => (nilai ? new Date(nilai) : new Date(NaN));

export default class PetHotel {
  constructor({ id_pesanan = null, jam_checkin, jam_checkout, tarif_per_hari }) {
    this.id_pesanan = id_pesanan;
    this.jam_checkin = keTanggal(jam_checkin);
    this.jam_checkout = keTanggal(jam_checkout);
    this.tarif_per_hari = Number(tarif_per_hari);
  }

  validasi() {
    if (isNaN(this.jam_checkin) || isNaN(this.jam_checkout)) {
      throw new AppError('jam_checkin dan jam_checkout harus berupa tanggal yang valid');
    }
    if (this.jam_checkout <= this.jam_checkin) {
      throw new AppError('jam_checkout harus setelah jam_checkin');
    }
    if (!Number.isFinite(this.tarif_per_hari) || this.tarif_per_hari < 0) {
      throw new AppError('tarif_per_hari tidak valid');
    }
  }

  // Dihitung per hari, dibulatkan ke atas, minimal 1 hari
  hitungDurasiHari() {
    return Math.max(1, Math.ceil((this.jam_checkout - this.jam_checkin) / MS_PER_HARI));
  }

  hitungTotal() {
    return Math.round(this.hitungDurasiHari() * this.tarif_per_hari);
  }
}
