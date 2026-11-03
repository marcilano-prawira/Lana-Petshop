import AppError from '../utils/AppError.js';

export default class User {
  static ROLE = { CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN', PEGAWAI: 'PEGAWAI' };

  #password; // private, sesuai class diagram (- password)

  constructor({ id_user = null, username, password, role = null, jenis_kelamin = null }) {
    this.id_user = id_user;
    this.username = typeof username === 'string' ? username.trim().toLowerCase() : username;
    this.#password = password;
    this.role = role;
    this.jenis_kelamin = jenis_kelamin;
  }

  get password() {
    return this.#password;
  }

  // login()
  validasiLogin() {
    if (!this.username || typeof this.#password !== 'string' || !this.#password) {
      throw new AppError('Username dan Password wajib diisi');
    }
  }

  validasiAkun() {
    if (typeof this.username !== 'string' || !/^[a-z0-9_.]{4,50}$/.test(this.username)) {
      throw new AppError('username harus 4-50 karakter (huruf, angka, titik, atau underscore)');
    }
    if (typeof this.#password !== 'string' || this.#password.length < 6) {
      throw new AppError('password minimal 6 karakter');
    }
    if (this.#password.length > 72) {
      throw new AppError('password maksimal 72 karakter');
    }
    if (this.jenis_kelamin != null && !['L', 'P'].includes(this.jenis_kelamin)) {
      throw new AppError('jenis_kelamin harus L atau P');
    }
  }
}
