import BaseRepository from './BaseRepository.js';

const SELECT_DETAIL = `
  SELECT pr.*, ps.jenis_pesanan, ps.status_pesanan, pt.nama_pet
  FROM progress_layanan pr
  JOIN pesanan ps ON ps.id_pesanan = pr.id_pesanan
  JOIN pet pt ON pt.id_pet = ps.id_pet`;

const URUTAN = 'ORDER BY pr.updated_at DESC, pr.id_progress DESC';

export default class ProgressRepository extends BaseRepository {
  constructor() {
    super('progress_layanan', 'id_progress');
  }

  async create({ id_pesanan, id_user, status_progress, keterangan, updated_by }, client) {
    const { rows } = await this.exec(client).query(
      `INSERT INTO progress_layanan (id_pesanan, id_user, status_progress, keterangan, updated_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id_pesanan, id_user, status_progress, keterangan, updated_by]
    );
    return rows[0];
  }

  async findByPesanan(idPesanan, client) {
    const { rows } = await this.exec(client).query(
      `${SELECT_DETAIL} WHERE pr.id_pesanan = $1 ${URUTAN}`, [idPesanan]
    );
    return rows;
  }

  async findAllDetail(idUser = null) {
    const { rows } = idUser
      ? await this.db.query(`${SELECT_DETAIL} WHERE pr.id_user = $1 ${URUTAN}`, [idUser])
      : await this.db.query(`${SELECT_DETAIL} ${URUTAN}`);
    return rows;
  }
}
