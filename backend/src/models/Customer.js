import AppError from '../utils/AppError.js';
import User from './User.js';

// Customer extends User (sesuai class diagram)
export default class Customer extends User {
  constructor({ nama_customer, alamat_customer = null, no_hp_customer, ...akun }) {
    super({ ...akun, role: User.ROLE.CUSTOMER });
    this.nama_customer = typeof nama_customer === 'string' ? nama_customer.trim() : nama_customer;
    this.alamat_customer = alamat_customer;
    this.no_hp_customer = typeof no_hp_customer === 'string' ? no_hp_customer.trim() : no_hp_customer;
  }

  // regristasi()
  validasiRegistrasi() {
    this.validasiAkun();
    if (!this.nama_customer) throw new AppError('nama_customer wajib diisi');
    if (this.nama_customer.length > 100) throw new AppError('nama_customer maksimal 100 karakter');
    if (!this.no_hp_customer || !/^\+?[0-9]{8,15}$/.test(this.no_hp_customer)) {
      throw new AppError('no_hp_customer harus 8-15 digit angka');
    }
  }
}
