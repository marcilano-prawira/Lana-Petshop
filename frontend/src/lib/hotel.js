const MS_HARI = 24 * 60 * 60 * 1000;

// Sama dengan PetHotel.js di backend: per 24 jam, dibulatkan ke atas, minimal 1 hari.
export function hitungDurasiHari(checkin, checkout) {
  const selisih = new Date(checkout) - new Date(checkin);
  return Math.max(1, Math.ceil(selisih / MS_HARI));
}

export function hitungTotalHotel(checkin, checkout, tarifPerHari) {
  return Math.round(hitungDurasiHari(checkin, checkout) * Number(tarifPerHari));
}

// Date -> "2026-11-05T09:00" untuk atribut min pada input datetime-local
export function keInputLokal(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

export function formatTanggalWaktu(nilai) {
  return new Date(nilai).toLocaleString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).replace(/\./g, '.');
}
