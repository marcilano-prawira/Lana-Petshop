import db from '../config/database.js';
import AppError from '../utils/AppError.js';
import Pesanan from '../models/Pesanan.js';
import PetHotel from '../models/PetHotel.js';

export default class PesananService {
  constructor({ pesananRepository, petRepository, paketRepository, hotelRepository, progressRepository }) {
    this.pesananRepository = pesananRepository;
    this.petRepository = petRepository;
    this.paketRepository = paketRepository;
    this.hotelRepository = hotelRepository;
    this.progressRepository = progressRepository;
    this.tarifHotelPerHari = Number(process.env.HOTEL_TARIF_PER_HARI) || 75000;
  }

  async #pastikanPetMilikCustomer(user, idPet) {
    const pet = await this.petRepository.findById(idPet);
    if (!pet) throw new AppError('Pet tidak ditemukan', 404);
    if (pet.id_user !== user.id_user) throw new AppError('Pet bukan milik Anda', 403);
  }

  // pesanlayanangrooming()
  async pesanGrooming(user, body) {
    const pesanan = new Pesanan({
      id_user: user.id_user,
      id_pet: body.id_pet,
      id_layanan: body.id_layanan,
      jenis_pesanan: Pesanan.JENIS.GROOMING,
    });
    pesanan.validasi();
    await this.#pastikanPetMilikCustomer(user, pesanan.id_pet);

    const paket = await this.paketRepository.findById(pesanan.id_layanan);
    if (!paket) throw new AppError('Paket grooming tidak ditemukan', 404);

    return db.transaction(async (client) => {
      const baru = await this.pesananRepository.create(pesanan, client);
      await this.progressRepository.create({
        id_pesanan: baru.id_pesanan,
        id_user: user.id_user,
        status_progress: 'Menunggu Pembayaran',
        keterangan: 'Pesanan grooming berhasil dibuat',
        updated_by: null,
      }, client);
      return this.pesananRepository.findDetailById(baru.id_pesanan, client);
    });
  }

  // pesanlayananhotel()
  async pesanHotel(user, body) {
    const pesanan = new Pesanan({
      id_user: user.id_user,
      id_pet: body.id_pet,
      jenis_pesanan: Pesanan.JENIS.HOTEL,
    });
    pesanan.validasi();

    const hotel = new PetHotel({
      jam_checkin: body.jam_checkin,
      jam_checkout: body.jam_checkout,
      tarif_per_hari: this.tarifHotelPerHari,
    });
    hotel.validasi();

    await this.#pastikanPetMilikCustomer(user, pesanan.id_pet);

    return db.transaction(async (client) => {
      const baru = await this.pesananRepository.create(pesanan, client);
      await this.hotelRepository.create({ ...hotel, id_pesanan: baru.id_pesanan }, client);
      await this.progressRepository.create({
        id_pesanan: baru.id_pesanan,
        id_user: user.id_user,
        status_progress: 'Menunggu Pembayaran',
        keterangan: 'Pesanan pet hotel berhasil dibuat',
        updated_by: null,
      }, client);
      return this.pesananRepository.findDetailById(baru.id_pesanan, client);
    });
  }

  // Admin melihat semua pesanan, customer hanya pesanan miliknya
  lihat(user) {
    return this.pesananRepository.findAllDetail(user.role === 'CUSTOMER' ? user.id_user : null);
  }

  async lihatById(user, id) {
    const pesanan = await this.pesananRepository.findDetailById(id);
    if (!pesanan) throw new AppError('Pesanan tidak ditemukan', 404);
    if (user.role === 'CUSTOMER' && pesanan.id_user !== user.id_user) {
      throw new AppError('Pesanan bukan milik Anda', 403);
    }
    return { ...pesanan, total_harga: Pesanan.hitungTotal(pesanan) };
  }

  // batalpesanan()
  async batal(user, id) {
    const pesanan = await this.lihatById(user, id);
    if (pesanan.status_pesanan !== Pesanan.STATUS.MENUNGGU) {
      throw new AppError('Pesanan tidak dapat dibatalkan karena sudah diproses/selesai/dibatalkan', 409);
    }
    return db.transaction(async (client) => {
      await this.pesananRepository.updateStatus(id, Pesanan.STATUS.DIBATALKAN, client);
      await this.progressRepository.create({
        id_pesanan: id,
        id_user: pesanan.id_user,
        status_progress: 'Dibatalkan',
        keterangan: 'Pesanan dibatalkan oleh customer',
        updated_by: null,
      }, client);
      return this.pesananRepository.findDetailById(id, client);
    });
  }
}
