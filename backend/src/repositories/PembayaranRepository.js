import BaseRepository from './BaseRepository.js';

const SELECT_DETAIL = `
  SELECT pb.*, c.nama_customer
  FROM pembayaran pb
  JOIN customer c ON c.id_user = pb.id_user`;

export default class PembayaranRepository extends BaseRepository {
  constructor() {
    super('pembayaran', 'id_pembayaran');
  }

  async create(p, client) {
    const { rows } = await this.exec(client).query(
      `INSERT INTO pembayaran (id_pesanan, id_user, total_harga, metode_pembayaran, bukti_pembayaran)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [p.id_pesanan, p.id_user, p.total_harga, p.metode_pembayaran, p.bukti_pembayaran]
    );
    return rows[0];
  }

  // Dipakai jika pembayaran sebelumnya DITOLAK lalu customer membayar ulang
  async ajukanUlang(id, p, client) {
    const { rows } = await this.exec(client).query(
      `UPDATE pembayaran
       SET metode_pembayaran = $1, bukti_pembayaran = $2, total_harga = $3,
           status_pembayaran = 'MENUNGGU', tanggal_bayar = NOW(),
           diverifikasi_oleh = NULL, tanggal_verifikasi = NULL
       WHERE id_pembayaran = $4 RETURNING *`,
      [p.metode_pembayaran, p.bukti_pembayaran, p.total_harga, id]
    );
    return rows[0];
  }

  async findAllDetail(idUser = null) {
    const { rows } = idUser
      ? await this.db.query(`${SELECT_DETAIL} WHERE pb.id_user = $1 ORDER BY pb.tanggal_bayar DESC`, [idUser])
      : await this.db.query(`${SELECT_DETAIL} ORDER BY pb.tanggal_bayar DESC`);
    return rows;
  }

  async findByPesanan(idPesanan, client) {
    const { rows } = await this.exec(client).query(
      'SELECT * FROM pembayaran WHERE id_pesanan = $1', [idPesanan]
    );
    return rows[0] ?? null;
  }

  async verifikasi(id, { status, idAdmin }, client) {
    const { rows } = await this.exec(client).query(
      `UPDATE pembayaran
       SET status_pembayaran = $1, diverifikasi_oleh = $2, tanggal_verifikasi = NOW()
       WHERE id_pembayaran = $3 RETURNING *`,
      [status, idAdmin, id]
    );
    return rows[0] ?? null;
  }
}
