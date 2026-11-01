import BaseRepository from './BaseRepository.js';

// ras_hewan (kolom DB) juga dikirim sebagai ras_pet karena itu nama field di frontend
const KOLOM = '*, ras_hewan AS ras_pet';

export default class PetRepository extends BaseRepository {
  constructor() {
    super('pet', 'id_pet');
  }

  async findByCustomer(idUser) {
    const { rows } = await this.db.query(
      `SELECT ${KOLOM} FROM pet WHERE id_user = $1 ORDER BY id_pet`, [idUser]
    );
    return rows;
  }

  async existsByNama(idUser, namaPet) {
    const { rowCount } = await this.db.query(
      'SELECT 1 FROM pet WHERE id_user = $1 AND LOWER(nama_pet) = LOWER($2)', [idUser, namaPet]
    );
    return rowCount > 0;
  }

  async create({ id_user, nama_pet, jenis_pet, ras_hewan, usia, berat, alergi }, client) {
    const { rows } = await this.exec(client).query(
      `INSERT INTO pet (id_user, nama_pet, jenis_pet, ras_hewan, usia, berat, alergi)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${KOLOM}`,
      [id_user, nama_pet, jenis_pet, ras_hewan, usia, berat, alergi]
    );
    return rows[0];
  }
}
