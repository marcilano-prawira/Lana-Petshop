import AppError from '../utils/AppError.js';

const teks = (v) => (typeof v === 'string' ? v.trim() : v);
const kosongJadiNull = (v) => (v === '' || v === undefined || v === null ? null : v);

export default class Pet {
  // ras_pet = nama field yang dipakai frontend, ras_hewan = nama kolom di database
  constructor({ id_pet = null, id_user, nama_pet, jenis_pet, ras_pet, ras_hewan, usia, berat, alergi }) {
    this.id_pet = id_pet;
    this.id_user = id_user;
    this.nama_pet = teks(nama_pet);
    this.jenis_pet = teks(jenis_pet);
    this.ras_hewan = kosongJadiNull(teks(ras_pet ?? ras_hewan));
    this.usia = kosongJadiNull(usia) === null ? null : Number(usia);
    this.berat = kosongJadiNull(berat) === null ? null : Number(berat);
    this.alergi = kosongJadiNull(teks(alergi));
  }

  validasi() {
    if (typeof this.nama_pet !== 'string' || !this.nama_pet) throw new AppError('nama_pet wajib diisi');
    if (this.nama_pet.length > 100) throw new AppError('nama_pet maksimal 100 karakter');

    if (typeof this.jenis_pet !== 'string' || !this.jenis_pet) throw new AppError('jenis_pet wajib diisi');
    if (this.jenis_pet.length > 50) throw new AppError('jenis_pet maksimal 50 karakter');

    if (this.ras_hewan !== null) {
      if (typeof this.ras_hewan !== 'string') throw new AppError('ras_pet harus berupa teks');
      if (this.ras_hewan.length > 100) throw new AppError('ras_pet maksimal 100 karakter');
    }
    if (this.usia !== null && (!Number.isInteger(this.usia) || this.usia < 0 || this.usia > 100)) {
      throw new AppError('usia harus berupa bilangan bulat 0-100');
    }
    if (this.berat !== null && (!Number.isInteger(this.berat) || this.berat <= 0 || this.berat > 1000)) {
      throw new AppError('berat harus berupa bilangan bulat lebih dari 0');
    }
    if (this.alergi !== null && typeof this.alergi !== 'string') {
      throw new AppError('alergi harus berupa teks');
    }
  }
}
