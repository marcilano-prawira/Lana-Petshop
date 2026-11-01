import BaseController from './BaseController.js';

export default class PetController extends BaseController {
  constructor(service) {
    super();
    this.service = service;
  }

  lihat = async (req, res) => {
    const data = await this.service.lihatMilikSaya(req.user);
    this.sukses(res, 'Daftar pet berhasil dimuat', data);
  };

  tambah = async (req, res) => {
    const data = await this.service.tambah(req.user, this.body(req));
    this.sukses(res, 'Hewan berhasil didaftarkan', data, 201);
  };
}
