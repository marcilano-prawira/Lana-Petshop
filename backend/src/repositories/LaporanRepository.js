import BaseRepository from './BaseRepository.js';

export default class LaporanRepository extends BaseRepository {
  constructor() {
    super('laporan_lanapetshop', 'id_laporan');
  }

  // Pesanan pada bulan/tahun tertentu yang pembayarannya sudah terverifikasi
  async findPesananTerverifikasi(bulan, tahun, client) {
    const { rows } = await this.exec(client).query(
      `SELECT ps.id_pesanan, pb.total_harga
       FROM pesanan ps
       JOIN pembayaran pb ON pb.id_pesanan = ps.id_pesanan
       WHERE pb.status_pembayaran = 'TERVERIFIKASI'
         AND ps.status_pesanan <> 'DIBATALKAN'
         AND ps.tanggal_pesanan >= make_date($2::int, $1::int, 1)
         AND ps.tanggal_pesanan <  make_date($2::int, $1::int, 1) + INTERVAL '1 month'
       ORDER BY ps.tanggal_pesanan`,
      [bulan, tahun]
    );
    return rows;
  }

  async create({ id_user, bulan, tahun, total_pesanan, total_pendapatan }, client) {
    const { rows } = await this.exec(client).query(
      `INSERT INTO laporan_lanapetshop (id_user, bulan, tahun, total_pesanan, total_pendapatan)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id_user, bulan, tahun, total_pesanan, total_pendapatan]
    );
    return rows[0];
  }

  async tambahDetail(idLaporan, daftarIdPesanan, client) {
    if (daftarIdPesanan.length === 0) return;
    await this.exec(client).query(
      `INSERT INTO laporan_detail (id_laporan, id_pesanan)
       SELECT $1, UNNEST($2::varchar[])`,
      [idLaporan, daftarIdPesanan]
    );
  }

  async findAllFilter({ bulan, tahun }) {
    const kondisi = [];
    const params = [];
    if (bulan) { params.push(bulan); kondisi.push(`bulan = $${params.length}`); }
    if (tahun) { params.push(tahun); kondisi.push(`tahun = $${params.length}`); }
    const where = kondisi.length ? `WHERE ${kondisi.join(' AND ')}` : '';
    const { rows } = await this.db.query(
      `SELECT * FROM laporan_lanapetshop ${where} ORDER BY tahun DESC, bulan DESC`, params
    );
    return rows;
  }

  async findDetail(idLaporan) {
    const { rows } = await this.db.query(
      `SELECT ps.id_pesanan, ps.jenis_pesanan, ps.tanggal_pesanan, ps.status_pesanan,
              c.nama_customer, pg.nama_layanan, pb.total_harga
       FROM laporan_detail ld
       JOIN pesanan ps ON ps.id_pesanan = ld.id_pesanan
       JOIN customer c ON c.id_user = ps.id_user
       LEFT JOIN paket_grooming pg ON pg.id_layanan = ps.id_layanan
       LEFT JOIN pembayaran pb ON pb.id_pesanan = ps.id_pesanan
       WHERE ld.id_laporan = $1
       ORDER BY ps.tanggal_pesanan`,
      [idLaporan]
    );
    return rows;
  }
}
