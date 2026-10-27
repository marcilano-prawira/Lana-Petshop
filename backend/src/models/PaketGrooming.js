import AppError from '../utils/AppError.js';

export default class PaketGrooming {
  constructor({ id_layanan = null, id_user, nama_layanan, detail_layanan = null, jenis_paket, harga_paket }) {
    this.id_layanan = id_layanan;
    this.id_user = id_user;
    this.nama_layanan = typeof nama_layanan === 'string' ? nama_layanan.trim() : nama_layanan;
    this.detail_layanan = detail_layanan;
    this.jenis_paket = typeof jenis_paket === 'string' ? jenis_paket.trim() : jenis_paket;
    this.harga_paket = Number(harga_paket);
  }

  validasi() {
    if (!this.nama_layanan) throw new AppError('nama_layanan wajib diisi');
    if (this.nama_layanan.length > 100) throw new AppError('nama_layanan maksimal 100 karakter');
    if (!this.jenis_paket) throw new AppError('jenis_paket wajib diisi');
    if (!Number.isFinite(this.harga_paket) || this.harga_paket < 0) {
      throw new AppError('harga_paket harus berupa angka >= 0');
    }
  }
}
