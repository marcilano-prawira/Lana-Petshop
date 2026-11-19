import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import AppError from '../utils/AppError.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Profil from '../models/Profil.js';
import PembatasPercobaan from '../utils/PembatasPercobaan.js';

export default class AuthService {
  constructor({ userRepository, customerRepository, adminRepository, tokenRepository, tokenService, pembatas = new PembatasPercobaan() }) {
    this.userRepository = userRepository;
    this.customerRepository = customerRepository;
    this.adminRepository = adminRepository;
    this.tokenRepository = tokenRepository;
    this.tokenService = tokenService;
    this.pembatas = pembatas;
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

  // Pengguna (customer maupun admin) mengubah username, alamat, dan/atau foto profilnya sendiri.
  // Field yang tidak dikirim tidak diubah. foto_profil: null = hapus foto.
  async perbaruiProfil(user, body) {
    const ada = (k) => body[k] !== undefined;
    if (!['username', 'alamat', 'foto_profil'].some(ada)) {
      throw new AppError('Tidak ada data profil yang diubah');
    }

    // 1. Validasi semua field dulu sebelum menyentuh database
    const usernameBaru = ada('username') ? Profil.validasiUsername(body.username) : undefined;
    let alamat;
    if (ada('alamat')) {
      if (!Profil.ROLE_BERALAMAT.includes(user.role)) {
        throw new AppError('Akun dengan peran ini belum mendukung alamat', 400);
      }
      alamat = Profil.validasiAlamat(body.alamat);
    }
    const foto = ada('foto_profil') ? Profil.validasiFoto(body.foto_profil) : undefined;

    // 2. Mengganti username = mengganti kredensial login, wajib konfirmasi password saat ini.
    //    Memakai 403 (bukan 401) supaya frontend tidak menganggap sesi berakhir.
    const lama = await this.userRepository.findByIdDenganPassword(user.id_user);
    if (!lama) throw new AppError('Akun tidak ditemukan', 401);
    const gantiUsername = usernameBaru !== undefined && usernameBaru !== lama.username;
    if (gantiUsername) {
      if (typeof body.password_saat_ini !== 'string' || !body.password_saat_ini) {
        throw new AppError('password_saat_ini wajib diisi untuk mengganti username');
      }
      // Lewat pembatas percobaan yang sama dengan ganti password
      await this.#pastikanPasswordBenar(user.id_user, body.password_saat_ini, 'Password saat ini');
    }

    // 3. Simpan sekaligus (semua berhasil atau tidak sama sekali)
    try {
      await db.transaction(async (client) => {
        if (gantiUsername) await this.userRepository.updateUsername(user.id_user, usernameBaru, client);
        if (foto !== undefined) await this.userRepository.updateFoto(user.id_user, foto, client);
        if (alamat !== undefined) {
          const repo = user.role === 'ADMIN' ? this.adminRepository : this.customerRepository;
          await repo.updateAlamat(user.id_user, alamat, client);
        }
      });
    } catch (err) {
      if (err.code === '23505') throw new AppError('Username sudah digunakan, pilih username lain', 409);
      throw err;
    }

    return this.userRepository.findProfil(user.id_user);
  }

  // Mencocokkan password yang diketik dengan hash di database.
  // Salah -> 403 (bukan 401, supaya frontend tidak mengira sesi berakhir) dan dihitung sebagai percobaan gagal.
  async #pastikanPasswordBenar(idUser, passwordInput, namaField) {
    this.pembatas.periksa(idUser);
    if (typeof passwordInput !== 'string' || !passwordInput) throw new AppError(`${namaField} wajib diisi`);

    const akun = await this.userRepository.findByIdDenganPassword(idUser);
    if (!akun) throw new AppError('Akun tidak ditemukan', 401);

    if (!(await bcrypt.compare(passwordInput, akun.password))) {
      this.pembatas.catatGagal(idUser);
      throw new AppError(`${namaField} salah`, 403);
    }
    this.pembatas.reset(idUser);
    return akun;
  }

  // Langkah 1 ganti password: memastikan password lama benar sebelum form password baru dibuka.
  async verifikasiPasswordLama(user, body) {
    await this.#pastikanPasswordBenar(user.id_user, body.password_lama, 'Password lama');
    return { valid: true };
  }

  // Langkah 2 ganti password. Password lama diperiksa ulang di sini (tidak mengandalkan langkah 1),
  // lalu seluruh sesi lama dicabut: token ini lewat tabel token_dicabut, token lain lewat password_diubah_at.
  async gantiPassword(user, tokenPayload, body) {
    const akun = await this.#pastikanPasswordBenar(user.id_user, body.password_lama, 'Password lama');

    Profil.validasiPasswordBaru(body.password_baru, akun.username);
    if (await bcrypt.compare(body.password_baru, akun.password)) {
      throw new AppError('Password baru tidak boleh sama dengan password lama');
    }

    const hash = await bcrypt.hash(body.password_baru, 10);
    await db.transaction(async (client) => {
      await this.userRepository.updatePassword(user.id_user, hash, new Date(), client);
      await this.tokenRepository.cabut({
        jti: tokenPayload.jti,
        id_user: user.id_user,
        expired_at: new Date(tokenPayload.exp * 1000),
      }, client);
    });
    await this.tokenRepository.bersihkanKedaluwarsa();
  }
}
