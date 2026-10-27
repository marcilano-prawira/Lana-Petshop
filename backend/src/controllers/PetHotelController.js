import BaseController from './BaseController.js';

export default class PetHotelController extends BaseController {
  constructor(service) {
    super();
    this.service = service;
  }

  lihat = async (req, res) => {
    const data = await this.service.lihat(req.user);
    this.sukses(res, 'Data pet hotel berhasil dimuat', data);
  };

  lihatById = async (req, res) => {
    const data = await this.service.lihatById(req.user, req.params.id);
    this.sukses(res, 'Detail data pet hotel berhasil dimuat', data);
  };

  edit = async (req, res) => {
    const data = await this.service.edit(req.params.id, this.body(req));
    this.sukses(res, 'Data pesanan hotel berhasil diperbarui', data);
  };

  hapus = async (req, res) => {
    await this.service.hapus(req.params.id);
    this.sukses(res, 'Berhasil terhapus');
  };
}
