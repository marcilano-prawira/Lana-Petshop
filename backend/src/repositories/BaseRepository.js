import db from '../config/database.js';

export default class BaseRepository {
  constructor(table, primaryKey) {
    this.db = db;
    this.table = table;
    this.primaryKey = primaryKey;
  }

  // client diisi saat berada di dalam transaksi
  exec(client) {
    return client ?? this.db;
  }

  async findAll(client) {
    const { rows } = await this.exec(client).query(
      `SELECT * FROM ${this.table} ORDER BY ${this.primaryKey}`
    );
    return rows;
  }

  async findById(id, client) {
    const { rows } = await this.exec(client).query(
      `SELECT * FROM ${this.table} WHERE ${this.primaryKey} = $1`, [id]
    );
    return rows[0] ?? null;
  }

  async delete(id, client) {
    const { rowCount } = await this.exec(client).query(
      `DELETE FROM ${this.table} WHERE ${this.primaryKey} = $1`, [id]
    );
    return rowCount > 0;
  }
}
