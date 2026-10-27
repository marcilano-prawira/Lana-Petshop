import AppError from '../utils/AppError.js';

export default class Laporan {
  constructor({ id_user, bulan, tahun }) {
    this.id_user = id_user;
    this.bulan = Number(bulan);
    this.tahun = Number(tahun);
  }

  validasi() {
    if (!Number.isInteger(this.bulan) || this.bulan < 1 || this.bulan > 12) {
      throw new AppError('bulan harus berupa angka 1-12');
    }
    if (!Number.isInteger(this.tahun) || this.tahun < 2000 || this.tahun > 2100) {
      throw new AppError('tahun tidak valid');
    }
  }
}
