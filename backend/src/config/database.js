import pg from 'pg';

class Database {
  constructor() {
    this.pool = new pg.Pool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'lana_petshop',
    });
  }

  query(text, params) {
    return this.pool.query(text, params);
  }

  // Menjalankan beberapa query sebagai satu kesatuan (semua berhasil / semua batal)
  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const hasil = await callback(client);
      await client.query('COMMIT');
      return hasil;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async testConnection() {
    const { rows } = await this.query('SELECT NOW() AS now');
    return rows[0].now;
  }
}

export default new Database();
