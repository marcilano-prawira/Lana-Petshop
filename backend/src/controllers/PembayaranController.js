import BaseController from './BaseController.js';

export default class PembayaranController extends BaseController {
  constructor(service) {
    super();
    this.service = service;
  }

  bayar = async (req, res) => {
    const data = await this.service.bayar(req.user, this.body(req));
    this.sukses(res, 'Pembayaran berhasil', data, 201);
  };

  lihat = async (req, res) => {
    const data = await this.service.lihat(req.user);
    this.sukses(res, 'Daftar pembayaran berhasil dimuat', data);
  };

  verifikasi = async (req, res) => {
    const data = await this.service.verifikasi(req.user, req.params.id, this.body(req));
    this.sukses(res, 'Verifikasi pembayaran berhasil', data);
  };
}
