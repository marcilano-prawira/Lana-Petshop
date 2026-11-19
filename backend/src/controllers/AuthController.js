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

  perbaruiProfil = async (req, res) => {
    const data = await this.service.perbaruiProfil(req.user, this.body(req));
    this.sukses(res, 'Profil berhasil diperbarui', data);
  };

  verifikasiPasswordLama = async (req, res) => {
    const data = await this.service.verifikasiPasswordLama(req.user, this.body(req));
    this.sukses(res, 'Password lama benar', data);
  };

  gantiPassword = async (req, res) => {
    await this.service.gantiPassword(req.user, req.token, this.body(req));
    this.sukses(res, 'Password berhasil diubah. Silakan login kembali dengan password baru.');
  };

  saya = async (req, res) => {
    const data = await this.service.profil(req.user);
    this.sukses(res, 'Profil berhasil dimuat', data);
  };
}
