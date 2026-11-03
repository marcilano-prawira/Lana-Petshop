import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import AppError from '../utils/AppError.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';

export default class AuthService {
  constructor({ userRepository, customerRepository, tokenRepository, tokenService }) {
    this.userRepository = userRepository;
    this.customerRepository = customerRepository;
    this.tokenRepository = tokenRepository;
    this.tokenService = tokenService;
  }

  // registrasi() -> hanya Customer
  async registrasi(body) {
    const customer = new Customer({
      username: body.username,
      password: body.password,
      jenis_kelamin: body.jenis_kelamin,
      nama_customer: body.nama_customer,
      alamat_customer: body.alamat_customer,
      no_hp_customer: body.no_hp_customer,
    });
    customer.validasiRegistrasi();

    const hash = await bcrypt.hash(customer.password, 10);

    try {
      return await db.transaction(async (client) => {
        const user = await this.userRepository.create({
          username: customer.username,
          password: hash,
          role: customer.role,
          jenis_kelamin: customer.jenis_kelamin,
        }, client);

        await this.customerRepository.create({ ...customer, id_user: user.id_user }, client);

        return { ...user, nama_customer: customer.nama_customer };
      });
    } catch (err) {
      if (err.code === '23505') {
        throw new AppError('Pembuatan akun gagal: username sudah digunakan', 409);
      }
      throw err;
    }
  }

  // login() -> Admin & Customer
  async login(body) {
    const input = new User({ username: body.username, password: body.password });
    input.validasiLogin();

    const akun = await this.userRepository.findByUsername(input.username);
    const cocok = akun ? await bcrypt.compare(input.password, akun.password) : false;

    // Pesan sengaja sama untuk username salah maupun password salah
    if (!cocok) {
      throw new AppError('Username dan Password anda salah, silakan masukan kembali', 401);
    }

    const token = this.tokenService.buat(akun);
    return {
      token,
      user: {
        id_user: akun.id_user,
        username: akun.username,
        role: akun.role,
        nama: akun.nama,
      },
    };
  }

  // logout() -> mencabut hak akses token yang sedang dipakai
  async logout(user, tokenPayload) {
    await this.tokenRepository.cabut({
      jti: tokenPayload.jti,
      id_user: user.id_user,
      expired_at: new Date(tokenPayload.exp * 1000),
    });
    await this.tokenRepository.bersihkanKedaluwarsa();
  }

  async profil(user) {
    return this.userRepository.findProfil(user.id_user);
  }
}
