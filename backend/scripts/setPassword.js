// Pemakaian: node --env-file=.env scripts/setPassword.js <id_user> <password_baru>
import bcrypt from 'bcryptjs';
import db from '../src/config/database.js';

const [idUser, passwordBaru] = process.argv.slice(2);

if (!idUser || !passwordBaru) {
  console.log('Pemakaian: node --env-file=.env scripts/setPassword.js <id_user> <password_baru>');
  process.exit(1);
}

const hash = await bcrypt.hash(passwordBaru, 10);
const { rowCount } = await db.query('UPDATE users SET password = $1 WHERE id_user = $2', [hash, idUser]);

console.log(rowCount ? `Password ${idUser} berhasil diubah (ter-hash)` : `User ${idUser} tidak ditemukan`);
await db.pool.end();
