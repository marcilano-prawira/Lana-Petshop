import BaseRepository from './BaseRepository.js';

const SELECT_DETAIL = `
  SELECT ps.*, c.nama_customer, pt.nama_pet,
         pg.nama_layanan, pg.harga_paket,
         h.id_hotel, h.jam_checkin, h.jam_checkout, h.tarif_per_hari
  FROM pesanan ps
  JOIN customer c ON c.id_user = ps.id_user
  JOIN pet pt ON pt.id_pet = ps.id_pet
  LEFT JOIN paket_grooming pg ON pg.id_layanan = ps.id_layanan
  LEFT JOIN pet_hotel h ON h.id_pesanan = ps.id_pesanan`;

export default class PesananRepository extends BaseRepository {
  constructor() {
    super('pesanan', 'id_pesanan');
  }

  async create({ id_user, id_pet, id_layanan, jenis_pesanan }, client) {
    const { rows } = await this.exec(client).query(
      `INSERT INTO pesanan (id_user, id_pet, id_layanan, jenis_pesanan)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_user, id_pet, id_layanan, jenis_pesanan]
    );
    return rows[0];
  }

  // idUser diisi -> hanya pesanan milik customer tersebut
  async findAllDetail(idUser = null) {
    const { rows } = idUser
      ? await this.db.query(`${SELECT_DETAIL} WHERE ps.id_user = $1 ORDER BY ps.tanggal_pesanan DESC, ps.id_pesanan DESC`, [idUser])
      : await this.db.query(`${SELECT_DETAIL} ORDER BY ps.tanggal_pesanan DESC, ps.id_pesanan DESC`);
    return rows;
  }

  async findDetailById(id, client) {
    const { rows } = await this.exec(client).query(`${SELECT_DETAIL} WHERE ps.id_pesanan = $1`, [id]);
    return rows[0] ?? null;
  }

  async updateStatus(id, status, client) {
    const { rows } = await this.exec(client).query(
      'UPDATE pesanan SET status_pesanan = $1 WHERE id_pesanan = $2 RETURNING *', [status, id]
    );
    return rows[0] ?? null;
  }
}
