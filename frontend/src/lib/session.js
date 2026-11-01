// Sesi disimpan di sessionStorage: otomatis hilang saat tab/browser ditutup.
const KEY = 'lana_session';

export function muatSesi() {
  try {
    const mentah = sessionStorage.getItem(KEY);
    if (!mentah) return null;
    const s = JSON.parse(mentah);
    const valid =
      s && typeof s.token === 'string' && s.user && typeof s.user.username === 'string' && Number.isFinite(s.expiresAt);
    if (!valid || Date.now() >= s.expiresAt) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function simpanSesi(sesi) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(sesi));
  } catch {
    // penyimpanan penuh / diblokir: sesi tetap hidup di memori
  }
}

export function hapusSesi() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // abaikan
  }
}
