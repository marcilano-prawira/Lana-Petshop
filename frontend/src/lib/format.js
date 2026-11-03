const rupiahFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export const rupiah = (n) => rupiahFmt.format(Number(n) || 0);

// 7199000 ms -> "1:59:59"
export function formatSisa(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const j = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const d = total % 60;
  const dua = (x) => String(x).padStart(2, '0');
  return `${j}:${dua(m)}:${dua(d)}`;
}

export function formatJam(ts) {
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
}

export function formatDetik(ms) {
  return Math.ceil(ms / 1000);
}

export const NAMA_ROLE = {
  CUSTOMER: 'Pelanggan',
  ADMIN: 'Admin',
  PEGAWAI: 'Pegawai',
};

export function salam(date = new Date()) {
  const j = date.getHours();
  if (j < 11) return 'Selamat pagi';
  if (j < 15) return 'Selamat siang';
  if (j < 19) return 'Selamat sore';
  return 'Selamat malam';
}

export function formatTanggalPendek(nilai) {
  if (!nilai) return '—';
  return new Date(nilai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTanggalJam(nilai) {
  if (!nilai) return '—';
  const d = new Date(nilai);
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, ${d
    .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    .replace(':', '.')}`;
}
