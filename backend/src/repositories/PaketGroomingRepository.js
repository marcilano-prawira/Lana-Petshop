import BaseRepository from './BaseRepository.js';

export default class PaketGroomingRepository extends BaseRepository {
  constructor() {
    super('paket_grooming', 'id_layanan');
  }

  async create(p, client) {
    const { rows } = await this.exec(client).query(
      `INSERT INTO paket_grooming (id_user, nama_layanan, detail_layanan, jenis_paket, harga_paket)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [p.id_user, p.nama_layanan, p.detail_layanan, p.jenis_paket, p.harga_paket]
    );
    return rows[0];
  }

  async update(id, p, client) {
    const { rows } = await this.exec(client).query(
      `UPDATE paket_grooming
       SET nama_layanan = $1, detail_layanan = $2, jenis_paket = $3, harga_paket = $4
       WHERE id_layanan = $5 RETURNING *`,
      [p.nama_layanan, p.detail_layanan, p.jenis_paket, p.harga_paket, id]
    );
    return rows[0] ?? null;
  }
}
