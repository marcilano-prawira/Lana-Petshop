import AppError from '../utils/AppError.js';

/**
 * SEMENTARA: identitas diambil dari header "x-user-id" karena fitur login belum dibuat.
 * Role dibaca dari tabel users. Setelah login dibuat, ganti isi identifikasi() dengan verifikasi JWT.
 */
export default class AuthMiddleware {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  identifikasi = async (req, res, next) => {
    const idUser = req.header('x-user-id');
    if (!idUser) {
      throw new AppError('Header x-user-id wajib diisi (sementara, sebelum fitur login dibuat)', 401);
    }
    const user = await this.userRepository.findById(idUser);
    if (!user) throw new AppError('User tidak ditemukan', 401);

    req.user = { id_user: user.id_user, role: user.role };
    next();
  };

  izinkan = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('Anda tidak memiliki akses ke fitur ini', 403);
    }
    next();
  };
}
