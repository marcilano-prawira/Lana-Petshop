// Validasi form. Setiap fungsi mengembalikan ARRAY alasan kesalahan.
// Array kosong = valid. Aturan dasar disamakan dengan backend
// (User.js & Customer.js), lalu dibuat lebih ketat di bagian registrasi.

const unik = (arr) => [...new Set(arr)];
const karakter = (s) => Array.from(s);
const tampil = (chars) =>
  unik(chars)
    .map((c) => `"${c}"`)
    .join(' ');
const panjangByte = (s) => new TextEncoder().encode(s).length;

/* ------------------------------ USERNAME ------------------------------ */

export function validasiUsername(nilai, { mode = 'login' } = {}) {
  const alasan = [];
  const v = typeof nilai === 'string' ? nilai : '';

  if (v.length === 0) return ['Username wajib diisi.'];

  if (/\s/.test(v)) {
    alasan.push(
      /^\s|\s$/.test(v)
        ? 'Username tidak boleh diawali atau diakhiri spasi.'
        : 'Username tidak boleh mengandung spasi.'
    );
  }

  const kapital = karakter(v).filter((c) => c !== c.toLowerCase());
  if (kapital.length) {
    alasan.push(`Username harus huruf kecil semua. Huruf kapital ditemukan: ${tampil(kapital)}.`);
  }

  const terlarang = karakter(v.toLowerCase()).filter((c) => !/[a-z0-9_.\s]/.test(c));
  if (terlarang.length) {
    alasan.push(
      `Karakter ${tampil(terlarang)} tidak diperbolehkan. Gunakan hanya huruf kecil, angka, titik (.) atau underscore (_).`
    );
  }

  const panjang = karakter(v).length;
  if (panjang < 4) alasan.push(`Username terlalu pendek (${panjang} karakter). Minimal 4 karakter.`);
  if (panjang > 50) alasan.push(`Username terlalu panjang (${panjang} karakter). Maksimal 50 karakter.`);

  if (mode === 'register') {
    if (/^[._]|[._]$/.test(v)) {
      alasan.push('Username tidak boleh diawali atau diakhiri titik (.) atau underscore (_).');
    }
    if (/[._]{2,}/.test(v)) {
      alasan.push('Username tidak boleh memuat dua tanda titik/underscore berurutan.');
    }
    if (/^[0-9_.]+$/.test(v)) {
      alasan.push('Username harus memuat minimal satu huruf, tidak boleh angka saja.');
    }
  }

  return unik(alasan);
}

/* ------------------------------ PASSWORD ------------------------------ */

const PASSWORD_UMUM = [
  'password', 'password1', 'password123', 'passw0rd', '12345678', '123456789',
  '1234567890', 'qwerty123', 'qwertyuiop', 'abc12345', 'iloveyou', 'admin123',
  'admin1234', 'lanapetshop', 'petshop123',
];

// Login: hanya aturan dasar backend (6-72 karakter), karena akun lama
// tidak boleh terkunci oleh aturan registrasi yang lebih baru.
export function validasiPasswordLogin(nilai) {
  const v = typeof nilai === 'string' ? nilai : '';
  if (v.length === 0) return ['Password wajib diisi.'];

  const alasan = [];
  const panjang = karakter(v).length;
  if (panjang < 6) alasan.push(`Password terlalu pendek (${panjang} karakter). Minimal 6 karakter.`);
  if (panjang > 72) alasan.push(`Password terlalu panjang (${panjang} karakter). Maksimal 72 karakter.`);
  return alasan;
}

// Registrasi: lebih ketat daripada backend.
export function validasiPasswordRegistrasi(nilai, username = '') {
  const v = typeof nilai === 'string' ? nilai : '';
  if (v.length === 0) return ['Password wajib diisi.'];

  const alasan = [];
  const panjang = karakter(v).length;

  if (/\s/.test(v)) alasan.push('Password tidak boleh mengandung spasi.');
  if (panjang < 8) alasan.push(`Password terlalu pendek (${panjang} karakter). Minimal 8 karakter.`);
  if (panjang > 72 || panjangByte(v) > 72) {
    alasan.push('Password terlalu panjang. Maksimal 72 karakter.');
  }
  if (!/[a-z]/.test(v)) alasan.push('Password harus memuat minimal satu huruf kecil.');
  if (!/[A-Z]/.test(v)) alasan.push('Password harus memuat minimal satu huruf kapital.');
  if (!/[0-9]/.test(v)) alasan.push('Password harus memuat minimal satu angka.');
  if (!/[^A-Za-z0-9\s]/.test(v)) alasan.push('Password harus memuat minimal satu simbol (contoh: ! @ # $ %).');
  if (/(.)\1{3,}/.test(v)) alasan.push('Password tidak boleh memuat karakter yang sama berulang 4 kali atau lebih.');

  const u = (username || '').trim().toLowerCase();
  if (u.length >= 4 && v.toLowerCase().includes(u)) alasan.push('Password tidak boleh mengandung username.');
  if (PASSWORD_UMUM.includes(v.toLowerCase())) alasan.push('Password ini terlalu umum dan mudah ditebak.');

  return unik(alasan);
}

export function validasiKonfirmasiPassword(password, konfirmasi) {
  if (!konfirmasi) return ['Konfirmasi password wajib diisi.'];
  if (password !== konfirmasi) return ['Konfirmasi password tidak sama dengan password.'];
  return [];
}

/* ------------------------------- NAMA --------------------------------- */

export function validasiNama(nilai) {
  const v = typeof nilai === 'string' ? nilai : '';
  const t = v.trim();
  if (t.length === 0) return ['Nama lengkap wajib diisi.'];

  const alasan = [];
  if (v !== t) alasan.push('Nama tidak boleh diawali atau diakhiri spasi.');
  if (/\s{2,}/.test(t)) alasan.push('Nama tidak boleh memuat spasi berurutan.');
  if (/[0-9]/.test(t)) alasan.push('Nama tidak boleh mengandung angka.');

  const terlarang = karakter(t).filter((c) => !/[\p{L}\s.'’-]/u.test(c) && !/[0-9]/.test(c));
  if (terlarang.length) {
    alasan.push(
      `Karakter ${tampil(terlarang)} tidak diperbolehkan. Gunakan huruf, spasi, titik, apostrof atau tanda hubung.`
    );
  }

  const panjang = karakter(t).length;
  if (panjang < 3) alasan.push(`Nama terlalu pendek (${panjang} karakter). Minimal 3 karakter.`);
  if (panjang > 100) alasan.push(`Nama terlalu panjang (${panjang} karakter). Maksimal 100 karakter.`);

  return unik(alasan);
}

/* ------------------------------- NO. HP ------------------------------- */

export function validasiNoHp(nilai) {
  const v = typeof nilai === 'string' ? nilai : '';
  if (v.length === 0) return ['Nomor HP wajib diisi.'];

  const alasan = [];
  if (/\s/.test(v)) alasan.push('Nomor HP tidak boleh mengandung spasi.');
  if (/-/.test(v)) alasan.push('Nomor HP tidak boleh mengandung tanda hubung (-). Tulis angka saja.');

  const sisa = v.replace(/[\s-]/g, '');
  const aneh = karakter(sisa.replace(/^\+/, '')).filter((c) => !/[0-9]/.test(c));
  if (aneh.length) {
    alasan.push(`Nomor HP hanya boleh berisi angka. Karakter ${tampil(aneh)} tidak diperbolehkan.`);
  } else {
    const digit = sisa.replace(/^\+/, '');
    if (digit.length < 8) alasan.push(`Nomor HP terlalu pendek (${digit.length} digit). Minimal 8 digit.`);
    if (digit.length > 15) alasan.push(`Nomor HP terlalu panjang (${digit.length} digit). Maksimal 15 digit.`);
    if (digit.length > 0 && !/^(\+62|62|0)8/.test(sisa)) {
      alasan.push('Nomor HP harus nomor seluler Indonesia, diawali 08, 628 atau +628.');
    }
  }

  return unik(alasan);
}

/* ------------------------------- LAINNYA ------------------------------ */

export function validasiJenisKelamin(nilai) {
  return nilai === 'L' || nilai === 'P' ? [] : ['Jenis kelamin wajib dipilih.'];
}

// Alamat opsional di backend; bila diisi harus masuk akal.
export function validasiAlamat(nilai) {
  const t = (typeof nilai === 'string' ? nilai : '').trim();
  if (t.length === 0) return [];
  const alasan = [];
  if (t.length < 10) {
    alasan.push(`Alamat terlalu singkat (${t.length} karakter). Tulis minimal 10 karakter atau kosongkan.`);
  }
  if (t.length > 255) alasan.push(`Alamat terlalu panjang (${t.length} karakter). Maksimal 255 karakter.`);
  return alasan;
}

/* Kekuatan password untuk indikator di form registrasi (0-4). */
export function skorPassword(v) {
  if (!v) return 0;
  let skor = 0;
  if (v.length >= 8) skor++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) skor++;
  if (/[0-9]/.test(v)) skor++;
  if (/[^A-Za-z0-9\s]/.test(v)) skor++;
  return skor;
}

/* ------------------------------ PESANAN ------------------------------- */

export const BATAS_HOTEL = {
  MAKS_HARI_KE_DEPAN: 90, // check-in paling jauh 90 hari dari sekarang
  MAKS_DURASI_HARI: 30, // menginap paling lama 30 hari
  MIN_DURASI_JAM: 1, // menginap paling singkat 1 jam
  TOLERANSI_MENIT: 5, // toleransi check-in "sekarang"
};

const MS_JAM = 60 * 60 * 1000;
const MS_HARI = 24 * MS_JAM;

export function validasiPilihan(nilai, nama) {
  return nilai ? [] : [`${nama} wajib dipilih.`];
}

// nilai: string dari <input type="datetime-local"> ("2026-11-02T09:00")
function ke(nilai) {
  if (typeof nilai !== 'string' || nilai.trim() === '') return null;
  const d = new Date(nilai);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function validasiCheckin(nilai, sekarang = new Date()) {
  const d = ke(nilai);
  if (d === null) return ['Waktu check-in wajib diisi.'];
  if (d === undefined) return ['Format tanggal/waktu check-in tidak valid.'];

  const alasan = [];
  if (d.getTime() < sekarang.getTime() - BATAS_HOTEL.TOLERANSI_MENIT * 60 * 1000) {
    alasan.push('Waktu check-in sudah lewat. Pilih waktu sekarang atau setelahnya.');
  }
  if (d.getTime() > sekarang.getTime() + BATAS_HOTEL.MAKS_HARI_KE_DEPAN * MS_HARI) {
    alasan.push(`Check-in maksimal ${BATAS_HOTEL.MAKS_HARI_KE_DEPAN} hari dari sekarang.`);
  }
  return alasan;
}

export function validasiCheckout(checkin, checkout) {
  const keluar = ke(checkout);
  if (keluar === null) return ['Waktu check-out wajib diisi.'];
  if (keluar === undefined) return ['Format tanggal/waktu check-out tidak valid.'];

  const masuk = ke(checkin);
  if (!masuk) return []; // check-in belum valid; kesalahannya ditampilkan di kolom check-in

  const selisih = keluar.getTime() - masuk.getTime();
  if (selisih <= 0) return ['Waktu check-out harus setelah waktu check-in.'];

  const alasan = [];
  if (selisih < BATAS_HOTEL.MIN_DURASI_JAM * MS_JAM) {
    alasan.push(`Durasi menginap minimal ${BATAS_HOTEL.MIN_DURASI_JAM} jam.`);
  }
  if (selisih > BATAS_HOTEL.MAKS_DURASI_HARI * MS_HARI) {
    const hari = Math.ceil(selisih / MS_HARI);
    alasan.push(`Durasi menginap maksimal ${BATAS_HOTEL.MAKS_DURASI_HARI} hari (Anda memilih ${hari} hari).`);
  }
  return alasan;
}

/* ------------------------------- HEWAN -------------------------------- */

export function validasiNamaHewan(nilai) {
  const v = typeof nilai === 'string' ? nilai : '';
  if (v.trim().length === 0) return ['Nama hewan wajib diisi.'];

  const alasan = [];
  if (v !== v.trim()) alasan.push('Nama hewan tidak boleh diawali atau diakhiri spasi.');
  if (/\s{2,}/.test(v.trim())) alasan.push('Nama hewan tidak boleh memuat spasi berurutan.');

  const terlarang = karakter(v.trim()).filter((c) => !/[\p{L}0-9\s.'’-]/u.test(c));
  if (terlarang.length) {
    alasan.push(`Karakter ${tampil(terlarang)} tidak diperbolehkan. Gunakan huruf, angka, spasi, titik, apostrof atau tanda hubung.`);
  }

  const panjang = karakter(v.trim()).length;
  if (panjang < 2) alasan.push(`Nama hewan terlalu pendek (${panjang} karakter). Minimal 2 karakter.`);
  if (panjang > 50) alasan.push(`Nama hewan terlalu panjang (${panjang} karakter). Maksimal 50 karakter.`);
  return unik(alasan);
}

export function validasiJenisHewan(nilai, daftar) {
  if (!nilai) return ['Jenis hewan wajib dipilih.'];
  return daftar.includes(nilai) ? [] : ['Jenis hewan tidak dikenal. Pilih dari daftar.'];
}

export function validasiRasHewan(nilai) {
  const t = (typeof nilai === 'string' ? nilai : '').trim();
  if (t.length === 0) return []; // opsional
  const alasan = [];
  const terlarang = karakter(t).filter((c) => !/[\p{L}\s.'’-]/u.test(c));
  if (terlarang.length) alasan.push(`Karakter ${tampil(terlarang)} tidak diperbolehkan pada ras. Gunakan huruf saja.`);
  if (karakter(t).length > 50) alasan.push(`Ras terlalu panjang (${karakter(t).length} karakter). Maksimal 50 karakter.`);
  return unik(alasan);
}

/* ---------------------------- PEMBAYARAN ------------------------------ */

export function validasiMetodeBayar(nilai, daftar) {
  if (!nilai) return ['Metode pembayaran wajib dipilih.'];
  if (!daftar.includes(nilai)) return ['Metode pembayaran tidak dikenal. Pilih dari daftar.'];
  return [];
}
