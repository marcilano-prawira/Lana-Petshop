import BaseController from './BaseController.js';

export default class PaketGroomingController extends BaseController {
  constructor(service) {
    super();
    this.service = service;
  }

  lihat = async (req, res) => {
    const data = await this.service.lihat();
    this.sukses(res, 'Daftar paket grooming berhasil dimuat', data);
  };

  lihatById = async (req, res) => {
    const data = await this.service.lihatById(req.params.id);
    this.sukses(res, 'Detail paket grooming berhasil dimuat', data);
  };

  tambah = async (req, res) => {
    const data = await this.service.tambah(req.user, this.body(req));
    this.sukses(res, 'Daftar paket terbaru berhasil ditambahkan', data, 201);
  };

  edit = async (req, res) => {
    const data = await this.service.edit(req.params.id, this.body(req));
    this.sukses(res, 'Daftar paket berhasil diperbarui', data);
  };

  hapus = async (req, res) => {
    await this.service.hapus(req.params.id);
    this.sukses(res, 'Berhasil terhapus');
  };
}
