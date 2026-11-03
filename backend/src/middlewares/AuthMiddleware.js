import AppError from '../utils/AppError.js';

export default class AuthMiddleware {
  constructor({ tokenService, tokenRepository, userRepository }) {
    this.tokenService = tokenService;
    this.tokenRepository = tokenRepository;
    this.userRepository = userRepository;
  }

  // Header: Authorization: Bearer <token>
  identifikasi = async (req, res, next) => {
    const [skema, token] = (req.header('authorization') ?? '').split(' ');
    if (skema?.toLowerCase() !== 'bearer' || !token) {
      throw new AppError('Token tidak ditemukan, silakan login terlebih dahulu', 401);
    }

    let payload;
    try {
      payload = this.tokenService.verifikasi(token);
    } catch (err) {
      throw new AppError(
        err.name === 'TokenExpiredError'
          ? 'Sesi telah berakhir, silakan login kembali'
          : 'Token tidak valid',
        401
      );
    }

    if (await this.tokenRepository.sudahDicabut(payload.jti)) {
      throw new AppError('Sesi sudah berakhir (logout), silakan login kembali', 401);
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) throw new AppError('Akun tidak ditemukan', 401);

    req.user = { id_user: user.id_user, role: user.role };
    req.token = payload;
    next();
  };

  izinkan = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('Anda tidak memiliki akses ke fitur ini', 403);
    }
    next();
  };
}
