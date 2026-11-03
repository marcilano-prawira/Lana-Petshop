import BaseController from './BaseController.js';

export default class ProgressController extends BaseController {
  constructor(service) {
    super();
    this.service = service;
  }

  lihat = async (req, res) => {
    const data = await this.service.lihat(req.user);
    this.sukses(res, 'Progress layanan berhasil dimuat', data);
  };

  lihatByPesanan = async (req, res) => {
    const data = await this.service.lihatByPesanan(req.user, req.params.idPesanan);
    this.sukses(res, 'Progress layanan berhasil dimuat', data);
  };

  update = async (req, res) => {
    const data = await this.service.update(req.user, req.params.idPesanan, this.body(req));
    this.sukses(res, 'Update progress berhasil diperbarui', data, 201);
  };
}
