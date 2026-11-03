import BaseController from './BaseController.js';

export default class AuthController extends BaseController {
  constructor(service) {
    super();
    this.service = service;
  }

  registrasi = async (req, res) => {
    const data = await this.service.registrasi(this.body(req));
    this.sukses(res, 'Selamat akun anda berhasil dibuat, silakan login', data, 201);
  };

  login = async (req, res) => {
    const data = await this.service.login(this.body(req));
    this.sukses(res, `Selamat datang ${data.user.nama}`, data);
  };

  logout = async (req, res) => {
    await this.service.logout(req.user, req.token);
    this.sukses(res, 'Berhasil keluar akun');
  };

  saya = async (req, res) => {
    const data = await this.service.profil(req.user);
    this.sukses(res, 'Profil berhasil dimuat', data);
  };
}
