import AppError from '../utils/AppError.js';
import PaketGrooming from '../models/PaketGrooming.js';

export default class PaketGroomingService {
  constructor(paketRepository) {
    this.paketRepository = paketRepository;
  }

  // lihatpaketgrooming()
  lihat() {
    return this.paketRepository.findAll();
  }

  async lihatById(id) {
    const paket = await this.paketRepository.findById(id);
    if (!paket) throw new AppError('Paket grooming tidak ditemukan', 404);
    return paket;
  }

  // tambahPaketgrooming()
  async tambah(admin, body) {
    const paket = new PaketGrooming({ ...body, id_user: admin.id_user });
    paket.validasi();
    return this.paketRepository.create(paket);
  }

  // editPaketgrooming()
  async edit(id, body) {
    const lama = await this.lihatById(id);
    const paket = new PaketGrooming({ ...lama, ...body, id_layanan: id });
    paket.validasi();
    return this.paketRepository.update(id, paket);
  }

  // hapuspaketgrooming()
  async hapus(id) {
    await this.lihatById(id);
    try {
      await this.paketRepository.delete(id);
    } catch (err) {
      if (err.code === '23503') {
        throw new AppError('Gagal menghapus: paket sudah dipakai pada pesanan', 409);
      }
      throw err;
    }
  }
}
