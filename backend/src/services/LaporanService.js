import db from '../config/database.js';
import AppError from '../utils/AppError.js';
import Laporan from '../models/Laporan.js';

export default class LaporanService {
  constructor(laporanRepository) {
    this.laporanRepository = laporanRepository;
  }

  // tambahlaporan() -> Admin. Data dihitung otomatis dari pesanan yang pembayarannya terverifikasi.
  async tambah(admin, body) {
    const laporan = new Laporan({ id_user: admin.id_user, bulan: body.bulan, tahun: body.tahun });
    laporan.validasi();

    try {
      return await db.transaction(async (client) => {
        const pesanan = await this.laporanRepository.findPesananTerverifikasi(laporan.bulan, laporan.tahun, client);
        const totalPendapatan = pesanan.reduce((jumlah, p) => jumlah + Number(p.total_harga), 0);

        const baru = await this.laporanRepository.create({
          ...laporan,
          total_pesanan: pesanan.length,
          total_pendapatan: totalPendapatan,
        }, client);
        await this.laporanRepository.tambahDetail(baru.id_laporan, pesanan.map((p) => p.id_pesanan), client);
        return baru;
      });
    } catch (err) {
      if (err.code === '23505') {
        throw new AppError('Gagal menyimpan laporan: laporan bulan dan tahun tersebut sudah ada', 409);
      }
      throw err;
    }
  }

  // Lihat_Laporan()
  lihat(query) {
    return this.laporanRepository.findAllFilter({ bulan: query.bulan, tahun: query.tahun });
  }

  async lihatById(id) {
    const laporan = await this.laporanRepository.findById(id);
    if (!laporan) throw new AppError('Laporan tidak ditemukan', 404);
    const detail = await this.laporanRepository.findDetail(id);
    return { ...laporan, detail };
  }
}
