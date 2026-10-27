import BaseController from './BaseController.js';

export default class PesananController extends BaseController {
  constructor(service, petRepository) {
    super();
    this.service = service;
    this.petRepository = petRepository;
  }

  pesanGrooming = async (req, res) => {
    const data = await this.service.pesanGrooming(req.user, this.body(req));
    this.sukses(res, 'Pesanan berhasil', data, 201);
  };

  pesanHotel = async (req, res) => {
    const data = await this.service.pesanHotel(req.user, this.body(req));
    this.sukses(res, 'Pesanan berhasil', data, 201);
  };

  lihat = async (req, res) => {
    const data = await this.service.lihat(req.user);
    this.sukses(res, 'Daftar pesanan berhasil dimuat', data);
  };

  lihatById = async (req, res) => {
    const data = await this.service.lihatById(req.user, req.params.id);
    this.sukses(res, 'Detail pesanan berhasil dimuat', data);
  };

  batal = async (req, res) => {
    const data = await this.service.batal(req.user, req.params.id);
    this.sukses(res, 'Pesanan berhasil dibatalkan', data);
  };

  // Daftar pet milik customer (dipakai form pemesanan)
  lihatPetSaya = async (req, res) => {
    const data = await this.petRepository.findByCustomer(req.user.id_user);
    this.sukses(res, 'Daftar pet berhasil dimuat', data);
  };
}
