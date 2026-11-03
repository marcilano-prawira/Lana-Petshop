import AppError from '../utils/AppError.js';
import Pet from '../models/Pet.js';

export default class PetService {
  constructor(petRepository) {
    this.petRepository = petRepository;
  }

  // Daftar hewan milik customer yang sedang login
  lihatMilikSaya(user) {
    return this.petRepository.findByCustomer(user.id_user);
  }

  // Customer mendaftarkan hewan miliknya sendiri
  async tambah(user, body) {
    const pet = new Pet({ ...body, id_pet: null, id_user: user.id_user });
    pet.validasi();

    if (await this.petRepository.existsByNama(user.id_user, pet.nama_pet)) {
      throw new AppError(`Hewan bernama ${pet.nama_pet} sudah terdaftar`, 409);
    }
    return this.petRepository.create(pet);
  }
}
