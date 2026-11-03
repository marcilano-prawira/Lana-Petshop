import db from '../config/database.js';
import AppError from '../utils/AppError.js';
import Pesanan from '../models/Pesanan.js';
import ProgressLayanan from '../models/ProgressLayanan.js';

export default class ProgressService {
  constructor({ progressRepository, pesananRepository }) {
    this.progressRepository = progressRepository;
    this.pesananRepository = pesananRepository;
  }

  // lihatprogress() -> semua progress milik customer (admin: semua)
  lihat(user) {
    return this.progressRepository.findAllDetail(user.role === 'CUSTOMER' ? user.id_user : null);
  }

  // lihatprogress() untuk satu pesanan -> Customer (miliknya) & Admin
  async lihatByPesanan(user, idPesanan) {
    const pesanan = await this.pesananRepository.findDetailById(idPesanan);
    if (!pesanan) throw new AppError('Pesanan tidak ditemukan', 404);
    if (user.role === 'CUSTOMER' && pesanan.id_user !== user.id_user) {
      throw new AppError('Pesanan bukan milik Anda', 403);
    }
    const riwayat = await this.progressRepository.findByPesanan(idPesanan);
    return {
      id_pesanan: pesanan.id_pesanan,
      jenis_pesanan: pesanan.jenis_pesanan,
      nama_pet: pesanan.nama_pet,
      status_pesanan: pesanan.status_pesanan,
      progress_terkini: riwayat[0] ?? null,
      riwayat,
    };
  }

  // updateprogress() -> Admin
  async update(admin, idPesanan, body) {
    const pesanan = await this.pesananRepository.findDetailById(idPesanan);
    if (!pesanan) throw new AppError('Pesanan tidak ditemukan', 404);

    if (pesanan.status_pesanan === Pesanan.STATUS.MENUNGGU) {
      throw new AppError('Update progress gagal: pembayaran belum terverifikasi', 409);
    }
    if (pesanan.status_pesanan !== Pesanan.STATUS.DIPROSES) {
      throw new AppError('Update progress gagal: pesanan sudah selesai atau dibatalkan', 409);
    }

    const progress = new ProgressLayanan({
      id_pesanan: idPesanan,
      id_user: pesanan.id_user,
      status_progress: body.status_progress,
      keterangan: body.keterangan ?? null,
      updated_by: admin.id_user,
    });
    progress.validasi();

    return db.transaction(async (client) => {
      const baru = await this.progressRepository.create(progress, client);
      if (progress.menandaiSelesai) {
        await this.pesananRepository.updateStatus(idPesanan, Pesanan.STATUS.SELESAI, client);
      }
      return baru;
    });
  }
}
