import db from '../config/database.js';
import AppError from '../utils/AppError.js';
import Pembayaran from '../models/Pembayaran.js';
import Pesanan from '../models/Pesanan.js';

export default class PembayaranService {
  constructor({ pembayaranRepository, pesananRepository, progressRepository }) {
    this.pembayaranRepository = pembayaranRepository;
    this.pesananRepository = pesananRepository;
    this.progressRepository = progressRepository;
  }

  // bayarpesanan() -> Customer
  async bayar(user, body) {
    const pembayaran = new Pembayaran({
      id_pesanan: body.id_pesanan,
      id_user: user.id_user,
      metode_pembayaran: body.metode_pembayaran,
      bukti_pembayaran: body.bukti_pembayaran,
    });
    pembayaran.validasi();

    const pesanan = await this.pesananRepository.findDetailById(pembayaran.id_pesanan);
    if (!pesanan) throw new AppError('Pesanan tidak ditemukan', 404);
    if (pesanan.id_user !== user.id_user) throw new AppError('Pesanan bukan milik Anda', 403);
    if (pesanan.status_pesanan === Pesanan.STATUS.DIBATALKAN) {
      throw new AppError('Pembayaran gagal: pesanan sudah dibatalkan', 409);
    }

    // total dihitung server, tidak diambil dari input customer
    pembayaran.total_harga = Pesanan.hitungTotal(pesanan);

    const sebelumnya = await this.pembayaranRepository.findByPesanan(pembayaran.id_pesanan);
    if (sebelumnya && sebelumnya.status_pembayaran !== Pembayaran.STATUS.DITOLAK) {
      throw new AppError('Pesanan ini sudah memiliki pembayaran', 409);
    }

    return db.transaction(async (client) => {
      const hasil = sebelumnya
        ? await this.pembayaranRepository.ajukanUlang(sebelumnya.id_pembayaran, pembayaran, client)
        : await this.pembayaranRepository.create(pembayaran, client);

      await this.progressRepository.create({
        id_pesanan: pesanan.id_pesanan,
        id_user: pesanan.id_user,
        status_progress: 'Menunggu Verifikasi',
        keterangan: 'Pembayaran diterima, menunggu verifikasi kasir',
        updated_by: null,
      }, client);
      return hasil;
    });
  }

  lihat(user) {
    return this.pembayaranRepository.findAllDetail(user.role === 'CUSTOMER' ? user.id_user : null);
  }

  // Verifikasi pembayaran -> Admin (Kasir)
  async verifikasi(admin, id, body) {
    const status = String(body.status_pembayaran ?? '').toUpperCase();
    if (![Pembayaran.STATUS.TERVERIFIKASI, Pembayaran.STATUS.DITOLAK].includes(status)) {
      throw new AppError('status_pembayaran harus TERVERIFIKASI atau DITOLAK');
    }

    const pembayaran = await this.pembayaranRepository.findById(id);
    if (!pembayaran) throw new AppError('Pembayaran tidak ditemukan', 404);
    if (pembayaran.status_pembayaran !== Pembayaran.STATUS.MENUNGGU) {
      throw new AppError('Pembayaran ini sudah diverifikasi sebelumnya', 409);
    }

    return db.transaction(async (client) => {
      const hasil = await this.pembayaranRepository.verifikasi(
        id, { status, idAdmin: admin.id_user }, client
      );

      const diterima = status === Pembayaran.STATUS.TERVERIFIKASI;
      if (diterima) {
        await this.pesananRepository.updateStatus(pembayaran.id_pesanan, Pesanan.STATUS.DIPROSES, client);
      }
      await this.progressRepository.create({
        id_pesanan: pembayaran.id_pesanan,
        id_user: pembayaran.id_user,
        status_progress: diterima ? 'Pembayaran Terverifikasi' : 'Pembayaran Ditolak',
        keterangan: diterima ? 'Pesanan akan segera diproses' : 'Silakan lakukan pembayaran ulang',
        updated_by: admin.id_user,
      }, client);
      return hasil;
    });
  }
}
