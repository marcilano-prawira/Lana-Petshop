import BaseRepository from './BaseRepository.js';

export default class CustomerRepository extends BaseRepository {
  constructor() {
    super('customer', 'id_user');
  }

  async updateAlamat(idUser, alamat, client) {
    const { rowCount } = await this.exec(client).query(
      'UPDATE customer SET alamat_customer = $2 WHERE id_user = $1', [idUser, alamat]
    );
    return rowCount > 0;
  }

  async create({ id_user, nama_customer, alamat_customer, no_hp_customer }, client) {
    const { rows } = await this.exec(client).query(
      `INSERT INTO customer (id_user, nama_customer, alamat_customer, no_hp_customer)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id_user, nama_customer, alamat_customer, no_hp_customer]
    );
    return rows[0];
  }
}
