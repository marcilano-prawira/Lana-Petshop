import db from '../config/database.js';
import AppError from '../utils/AppError.js';
import PetHotel from '../models/PetHotel.js';

export default class PetHotelService {
  constructor({ hotelRepository, pesananRepository, pembayaranRepository }) {
    this.hotelRepository = hotelRepository;
    this.pesananRepository = pesananRepository;
    this.pembayaranRepository = pembayaranRepository;
  }

  // lihatdatapethotel() -> Customer & Admin
  lihat(user) {
    return this.hotelRepository.findAllDetail(user.role === 'CUSTOMER' ? user.id_user : null);
  }

  async lihatById(user, id) {
    const hotel = await this.hotelRepository.findDetailById(id);
    if (!hotel) throw new AppError('Data pet hotel tidak ditemukan', 404);
    if (user.role === 'CUSTOMER' && hotel.id_user !== user.id_user) {
      throw new AppError('Data pet hotel bukan milik Anda', 403);
    }
    return hotel;
  }

  // editdatapesanhotel() -> Admin
  async edit(id, body) {
    const lama = await this.hotelRepository.findDetailById(id);
    if (!lama) throw new AppError('Data pet hotel tidak ditemukan', 404);

    // Total harga dihitung dari durasi; jika sudah ada pembayaran, data tidak boleh diubah
    const pembayaran = await this.pembayaranRepository.findByPesanan(lama.id_pesanan);
    if (pembayaran) throw new AppError('Gagal memperbarui: pesanan sudah memiliki pembayaran', 409);

    const hotel = new PetHotel({
      jam_checkin: body.jam_checkin ?? lama.jam_checkin,
      jam_checkout: body.jam_checkout ?? lama.jam_checkout,
      tarif_per_hari: lama.tarif_per_hari,
    });
    hotel.validasi();

    await this.hotelRepository.update(id, hotel);
    return this.hotelRepository.findDetailById(id);
  }

  // hapusdatahotel() -> Admin (menghapus pesanan hotel beserta datanya)
  async hapus(id) {
    const hotel = await this.hotelRepository.findDetailById(id);
    if (!hotel) throw new AppError('Data pet hotel tidak ditemukan', 404);
    try {
      await db.transaction((client) => this.pesananRepository.delete(hotel.id_pesanan, client));
    } catch (err) {
      if (err.code === '23503') {
        throw new AppError('Gagal menghapus: pesanan sudah memiliki pembayaran/laporan', 409);
      }
      throw err;
    }
  }
}
