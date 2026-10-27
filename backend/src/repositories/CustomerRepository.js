import BaseRepository from './BaseRepository.js';

export default class CustomerRepository extends BaseRepository {
  constructor() {
    super('customer', 'id_user');
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
