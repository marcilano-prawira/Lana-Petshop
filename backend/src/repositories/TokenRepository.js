import BaseRepository from './BaseRepository.js';

export default class TokenRepository extends BaseRepository {
  constructor() {
    super('token_dicabut', 'jti');
  }

  async cabut({ jti, id_user, expired_at }, client) {
    await this.exec(client).query(
      `INSERT INTO token_dicabut (jti, id_user, expired_at)
       VALUES ($1, $2, $3) ON CONFLICT (jti) DO NOTHING`,
      [jti, id_user, expired_at]
    );
  }

  async sudahDicabut(jti) {
    const { rowCount } = await this.db.query('SELECT 1 FROM token_dicabut WHERE jti = $1', [jti]);
    return rowCount > 0;
  }

  // Token yang sudah kedaluwarsa otomatis tidak berlaku, jadi catatannya aman dihapus
  async bersihkanKedaluwarsa() {
    await this.db.query('DELETE FROM token_dicabut WHERE expired_at < NOW()');
  }
}
