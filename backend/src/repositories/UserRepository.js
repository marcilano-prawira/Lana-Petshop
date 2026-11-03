import BaseRepository from './BaseRepository.js';

const NAMA = 'COALESCE(c.nama_customer, a.nama_admin)';
const JOIN_NAMA = `
  FROM users u
  LEFT JOIN customer c ON c.id_user = u.id_user
  LEFT JOIN admin a ON a.id_user = u.id_user`;

export default class UserRepository extends BaseRepository {
  constructor() {
    super('users', 'id_user');
  }

  // Dipakai login: termasuk hash password
  async findByUsername(username) {
    const { rows } = await this.db.query(
      `SELECT u.*, ${NAMA} AS nama ${JOIN_NAMA} WHERE u.username = $1`, [username]
    );
    return rows[0] ?? null;
  }

  // Profil tanpa password
  async findProfil(idUser) {
    const { rows } = await this.db.query(
      `SELECT u.id_user, u.username, u.role, u.jenis_kelamin, ${NAMA} AS nama,
              c.alamat_customer, c.no_hp_customer
       ${JOIN_NAMA} WHERE u.id_user = $1`, [idUser]
    );
    return rows[0] ?? null;
  }

  async create({ username, password, role, jenis_kelamin }, client) {
    const { rows } = await this.exec(client).query(
      `INSERT INTO users (username, password, role, jenis_kelamin)
       VALUES ($1, $2, $3, $4)
       RETURNING id_user, username, role, jenis_kelamin`,
      [username, password, role, jenis_kelamin]
    );
    return rows[0];
  }
}
