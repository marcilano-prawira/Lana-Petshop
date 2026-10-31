import { MAX_LOGIN_ATTEMPTS, LOCKOUT_MS } from '../config.js';

// Pembatas percobaan login di sisi browser. Disimpan di localStorage supaya
// refresh halaman tidak mereset hitungan. Ini lapisan tambahan di UI saja,
// bukan pengganti rate limiting di server.
const KEY = 'lana_login_guard';

function baca() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      gagal: Number.isFinite(s.gagal) ? s.gagal : 0,
      kunciSampai: Number.isFinite(s.kunciSampai) ? s.kunciSampai : 0,
    };
  } catch {
    return { gagal: 0, kunciSampai: 0 };
  }
}

function tulis(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // abaikan
  }
}

export function sisaKunciMs() {
  const { kunciSampai } = baca();
  return Math.max(0, kunciSampai - Date.now());
}

export function sisaPercobaan() {
  const { gagal, kunciSampai } = baca();
  if (kunciSampai && Date.now() >= kunciSampai) return MAX_LOGIN_ATTEMPTS;
  return Math.max(0, MAX_LOGIN_ATTEMPTS - gagal);
}

// Mengembalikan { terkunci, sisa } setelah mencatat satu kegagalan.
export function catatGagal() {
  let { gagal, kunciSampai } = baca();
  if (kunciSampai && Date.now() >= kunciSampai) {
    gagal = 0;
    kunciSampai = 0;
  }
  gagal += 1;
  if (gagal >= MAX_LOGIN_ATTEMPTS) {
    kunciSampai = Date.now() + LOCKOUT_MS;
    gagal = 0;
  }
  tulis({ gagal, kunciSampai });
  return { terkunci: kunciSampai > Date.now(), sisa: Math.max(0, MAX_LOGIN_ATTEMPTS - gagal) };
}

export function resetGuard() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // abaikan
  }
}
