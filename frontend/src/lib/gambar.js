// Penanganan foto bukti pembayaran di browser:
//  1. validasi ketat (isi file diperiksa lewat "magic bytes", bukan hanya ekstensi)
//  2. dikecilkan & dikompres menjadi JPEG supaya ringan dikirim / disimpan
// Hasil akhirnya berupa data URL ("data:image/jpeg;base64,...") yang bisa
// langsung disimpan ke kolom TEXT di database, atau didecode ke BYTEA/file.

export const BATAS_BUKTI = {
  MAKS_BYTE_ASLI: 10 * 1024 * 1024, // 10 MB (foto asli dari kamera/ponsel)
  MIN_SISI_PX: 200, // terlalu kecil = tidak terbaca
  MAKS_SISI_HASIL_PX: 1280,
  TARGET_BYTE_HASIL: 350 * 1024, // target ukuran setelah kompres
};

const JENIS_DIDUKUNG = ['JPG', 'PNG', 'WEBP'];

// Mengenali jenis gambar dari byte pertama file. Mengembalikan 'JPG' | 'PNG' | 'WEBP' | null.
export function jenisDariBytes(b) {
  if (!b || b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'JPG';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return 'PNG';
  }
  const teks = (from, to) => String.fromCharCode(...b.slice(from, to));
  if (teks(0, 4) === 'RIFF' && teks(8, 12) === 'WEBP') return 'WEBP';
  return null;
}

const mb = (byte) => (byte / (1024 * 1024)).toFixed(1).replace('.', ',');

// Mengembalikan array alasan (kosong = file lolos pemeriksaan awal).
export async function periksaFileBukti(file) {
  if (!file) return ['Foto bukti pembayaran wajib diunggah.'];
  if (file.size === 0) return ['File kosong (0 byte). Pilih foto lain.'];

  const alasan = [];
  if (file.size > BATAS_BUKTI.MAKS_BYTE_ASLI) {
    alasan.push(`Ukuran foto terlalu besar (${mb(file.size)} MB). Maksimal ${mb(BATAS_BUKTI.MAKS_BYTE_ASLI)} MB.`);
  }

  let jenis = null;
  try {
    jenis = jenisDariBytes(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
  } catch {
    alasan.push('File tidak dapat dibaca. Coba pilih ulang.');
    return alasan;
  }
  if (!jenis || !JENIS_DIDUKUNG.includes(jenis)) {
    alasan.push(`File "${file.name}" bukan foto yang valid. Gunakan ${JENIS_DIDUKUNG.join(', ')}.`);
  }
  return alasan;
}

async function bukaGambar(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // lanjut ke cara lama
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Foto rusak atau tidak dapat dibuka.'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

const keBlob = (canvas, kualitas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal memproses foto.'))), 'image/jpeg', kualitas);
  });

const keDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('Gagal membaca hasil foto.'));
    r.readAsDataURL(blob);
  });

// Melempar Error (pesan siap tampil) bila foto tidak layak.
export async function kompresFoto(file) {
  const gambar = await bukaGambar(file);
  const { width: w0, height: h0 } = gambar;

  if (Math.min(w0, h0) < BATAS_BUKTI.MIN_SISI_PX) {
    throw new Error(`Resolusi foto terlalu kecil (${w0}×${h0} px). Minimal ${BATAS_BUKTI.MIN_SISI_PX} px pada sisi terpendek agar bukti terbaca.`);
  }

  let skala = Math.min(1, BATAS_BUKTI.MAKS_SISI_HASIL_PX / Math.max(w0, h0));
  let blob = null;
  let lebar = 0;
  let tinggi = 0;

  for (let percobaan = 0; percobaan < 4; percobaan++) {
    lebar = Math.max(1, Math.round(w0 * skala));
    tinggi = Math.max(1, Math.round(h0 * skala));
    const canvas = document.createElement('canvas');
    canvas.width = lebar;
    canvas.height = tinggi;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // PNG transparan -> latar putih
    ctx.fillRect(0, 0, lebar, tinggi);
    ctx.drawImage(gambar, 0, 0, lebar, tinggi);

    for (const kualitas of [0.85, 0.75, 0.65, 0.55]) {
      blob = await keBlob(canvas, kualitas);
      if (blob.size <= BATAS_BUKTI.TARGET_BYTE_HASIL) break;
    }
    if (blob.size <= BATAS_BUKTI.TARGET_BYTE_HASIL) break;
    skala *= 0.8; // masih besar: perkecil dimensi lalu ulangi
  }

  if (gambar.close) gambar.close();
  return { dataUrl: await keDataUrl(blob), byte: blob.size, lebar, tinggi };
}

export function formatUkuran(byte) {
  return byte >= 1024 * 1024 ? `${mb(byte)} MB` : `${Math.max(1, Math.round(byte / 1024))} KB`;
}
