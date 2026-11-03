import BaseRepository from './BaseRepository.js';

const SELECT_DETAIL = `
  SELECT h.*, ps.id_user, ps.id_pet, ps.status_pesanan, c.nama_customer, pt.nama_pet
  FROM pet_hotel h
  JOIN pesanan ps ON ps.id_pesanan = h.id_pesanan
  JOIN customer c ON c.id_user = ps.id_user
  JOIN pet pt ON pt.id_pet = ps.id_pet`;

export default class PetHotelRepository extends BaseRepository {
  constructor() {
    super('pet_hotel', 'id_hotel');
  }

  async create({ id_pesanan, jam_checkin, jam_checkout, tarif_per_hari }, client) {
    const { rows } = await this.exec(client).query(
      `INSERT INTO pet_hotel (id_pesanan, jam_checkin, jam_checkout, tarif_per_hari)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_pesanan, jam_checkin, jam_checkout, tarif_per_hari]
    );
    return rows[0];
  }

  async findAllDetail(idUser = null) {
    const { rows } = idUser
      ? await this.db.query(`${SELECT_DETAIL} WHERE ps.id_user = $1 ORDER BY h.jam_checkin DESC`, [idUser])
      : await this.db.query(`${SELECT_DETAIL} ORDER BY h.jam_checkin DESC`);
    return rows;
  }

  async findDetailById(id) {
    const { rows } = await this.db.query(`${SELECT_DETAIL} WHERE h.id_hotel = $1`, [id]);
    return rows[0] ?? null;
  }

  async update(id, { jam_checkin, jam_checkout }, client) {
    const { rows } = await this.exec(client).query(
      `UPDATE pet_hotel SET jam_checkin = $1, jam_checkout = $2
       WHERE id_hotel = $3 RETURNING *`,
      [jam_checkin, jam_checkout, id]
    );
    return rows[0] ?? null;
  }
}
