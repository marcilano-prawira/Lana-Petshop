import BaseRepository from './BaseRepository.js';

export default class AdminRepository extends BaseRepository {
  constructor() {
    super('admin', 'id_user');
  }

  async updateAlamat(idUser, alamat, client) {
    const { rowCount } = await this.exec(client).query(
      'UPDATE admin SET alamat_admin = $2 WHERE id_user = $1', [idUser, alamat]
    );
    return rowCount > 0;
  }
}
