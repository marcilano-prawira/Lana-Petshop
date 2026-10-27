import BaseController from './BaseController.js';

export default class LaporanController extends BaseController {
  constructor(service) {
    super();
    this.service = service;
  }

  tambah = async (req, res) => {
    const data = await this.service.tambah(req.user, this.body(req));
    this.sukses(res, 'Laporan terbaru berhasil ditambahkan', data, 201);
  };

  lihat = async (req, res) => {
    const data = await this.service.lihat(req.query);
    this.sukses(res, 'Daftar laporan berhasil dimuat', data);
  };

  lihatById = async (req, res) => {
    const data = await this.service.lihatById(req.params.id);
    this.sukses(res, 'Detail laporan berhasil dimuat', data);
  };
}
