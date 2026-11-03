import AppError from '../utils/AppError.js';

export default class ProgressLayanan {
  constructor({ id_pesanan, id_user, status_progress, keterangan = null, updated_by = null }) {
    this.id_pesanan = id_pesanan;
    this.id_user = id_user;
    this.status_progress = typeof status_progress === 'string' ? status_progress.trim() : status_progress;
    this.keterangan = keterangan;
    this.updated_by = updated_by;
  }

  validasi() {
    if (!this.status_progress) throw new AppError('status_progress wajib diisi');
    if (this.status_progress.length > 30) throw new AppError('status_progress maksimal 30 karakter');
  }

  get menandaiSelesai() {
    return this.status_progress.toLowerCase() === 'selesai';
  }
}
