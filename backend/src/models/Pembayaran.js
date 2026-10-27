import AppError from '../utils/AppError.js';

export default class Pembayaran {
  static STATUS = { MENUNGGU: 'MENUNGGU', TERVERIFIKASI: 'TERVERIFIKASI', DITOLAK: 'DITOLAK' };

  constructor({ id_pesanan, id_user, total_harga = 0, metode_pembayaran, bukti_pembayaran = null }) {
    this.id_pesanan = id_pesanan;
    this.id_user = id_user;
    this.total_harga = total_harga;
    this.metode_pembayaran = typeof metode_pembayaran === 'string' ? metode_pembayaran.trim() : metode_pembayaran;
    this.bukti_pembayaran = bukti_pembayaran;
  }

  validasi() {
    if (!this.id_pesanan) throw new AppError('id_pesanan wajib diisi');
    if (!this.metode_pembayaran) throw new AppError('metode_pembayaran wajib diisi');
    if (this.metode_pembayaran.length > 30) throw new AppError('metode_pembayaran maksimal 30 karakter');
  }
}
