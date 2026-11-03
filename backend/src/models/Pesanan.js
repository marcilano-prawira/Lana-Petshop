import AppError from '../utils/AppError.js';
import PetHotel from './PetHotel.js';

export default class Pesanan {
  static JENIS = { GROOMING: 'GROOMING', HOTEL: 'HOTEL' };
  static STATUS = { MENUNGGU: 'MENUNGGU', DIPROSES: 'DIPROSES', SELESAI: 'SELESAI', DIBATALKAN: 'DIBATALKAN' };

  constructor({ id_pesanan = null, id_user, id_pet, id_layanan = null, jenis_pesanan }) {
    this.id_pesanan = id_pesanan;
    this.id_user = id_user;
    this.id_pet = id_pet;
    this.id_layanan = id_layanan;
    this.jenis_pesanan = jenis_pesanan;
  }

  // validasipesanan()
  validasi() {
    if (!this.id_pet) throw new AppError('id_pet wajib diisi');
    if (!Object.values(Pesanan.JENIS).includes(this.jenis_pesanan)) {
      throw new AppError('jenis_pesanan harus GROOMING atau HOTEL');
    }
    if (this.jenis_pesanan === Pesanan.JENIS.GROOMING && !this.id_layanan) {
      throw new AppError('id_layanan wajib diisi untuk pesanan grooming');
    }
  }

  // Menghitung total harga dari baris pesanan hasil JOIN
  static hitungTotal(row) {
    if (row.jenis_pesanan === Pesanan.JENIS.GROOMING) {
      return Math.round(Number(row.harga_paket));
    }
    return new PetHotel(row).hitungTotal();
  }
}
