import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

export default class TokenService {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.expiresIn = process.env.JWT_EXPIRES_IN || '1d';
    if (!this.secret) {
      throw new Error('JWT_SECRET belum diisi di file .env');
    }
  }

  buat(user) {
    return jwt.sign(
      { role: user.role, jti: randomUUID() },
      this.secret,
      { subject: user.id_user, expiresIn: this.expiresIn }
    );
  }

  // Melempar error jika token salah / kedaluwarsa
  verifikasi(token) {
    return jwt.verify(token, this.secret);
  }
}
