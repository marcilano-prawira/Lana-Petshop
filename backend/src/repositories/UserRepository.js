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

  // Dipakai login: termasuk hash password. Kolom foto_profil sengaja tidak ikut dibaca (berat).
  async findByUsername(username) {
    const { rows } = await this.db.query(
      `SELECT u.id_user, u.username, u.password, u.role, u.jenis_kelamin, u.created_at,
              ${NAMA} AS nama ${JOIN_NAMA} WHERE u.username = $1`, [username]
    );
    return rows[0] ?? null;
  }

  // Dipanggil AuthMiddleware pada SETIAP request, jadi hanya kolom ringan (tanpa password & foto).
  async findById(id, client) {
    const { rows } = await this.exec(client).query(
      'SELECT id_user, username, role, jenis_kelamin, created_at FROM users WHERE id_user = $1', [id]
    );
    return rows[0] ?? null;
  }

  // Dipakai konfirmasi password saat mengganti username
  async findByIdDenganPassword(id) {
    const { rows } = await this.db.query(
      'SELECT id_user, username, password, role FROM users WHERE id_user = $1', [id]
    );
    return rows[0] ?? null;
  }

  // Profil tanpa password. `alamat` = alamat customer atau alamat admin.
  async findProfil(idUser) {
    const { rows } = await this.db.query(
      `SELECT u.id_user, u.username, u.role, u.jenis_kelamin, u.foto_profil, ${NAMA} AS nama,
              COALESCE(c.alamat_customer, a.alamat_admin) AS alamat,
              c.alamat_customer, c.no_hp_customer
       ${JOIN_NAMA} WHERE u.id_user = $1`, [idUser]
    );
    return rows[0] ?? null;
  }

  async updateUsername(idUser, username, client) {
    await this.exec(client).query('UPDATE users SET username = $2 WHERE id_user = $1', [idUser, username]);
  }

  async updateFoto(idUser, foto, client) {
    await this.exec(client).query('UPDATE users SET foto_profil = $2 WHERE id_user = $1', [idUser, foto]);
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
