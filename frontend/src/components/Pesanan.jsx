import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Notice } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { rupiah } from '../lib/format.js';

/* ----------------------- Hewan milik pelanggan ----------------------- */

export function usePetSaya() {
  const { apiAuth } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [pets, setPets] = useState([]);
  const [pesan, setPesan] = useState('');

  const muat = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await apiAuth('/pesanan/pet-saya');
      setPets(Array.isArray(res.data) ? res.data : []);
      setStatus('ok');
    } catch (err) {
      setPesan(err.message);
      setStatus('error');
    }
  }, [apiAuth]);

  useEffect(() => {
    muat();
  }, [muat]);

  return { status, pets, pesan, muat };
}

// Kolom info tambahan hewan (struktur tabel pet bisa berbeda-beda), tampil bila ada.
const KOLOM_INFO = ['jenis_pet', 'jenis_hewan', 'jenis', 'ras_pet', 'ras', 'umur_pet', 'umur'];
function infoPet(p) {
  return KOLOM_INFO.map((k) => p[k]).filter((v) => typeof v === 'string' || typeof v === 'number').slice(0, 2).join(' · ');
}

export function PilihPet({ data, nilai, onChange, errors, tampilkanError, disabled }) {
  const { status, pets, pesan, muat } = data;

  if (status === 'loading') {
    return <div className="pilih-grid" aria-busy="true">{[1, 2].map((n) => <div key={n} className="pilihan pilihan--skeleton" />)}</div>;
  }
  if (status === 'error') {
    return (
      <Notice tipe="error">
        Gagal memuat daftar hewan: {pesan}{' '}
        <button type="button" className="link-btn" onClick={muat}>Coba lagi</button>
      </Notice>
    );
  }
  if (pets.length === 0) {
    return (
      <div className="kosong">
        <strong>Belum ada hewan peliharaan di akun Anda.</strong>
        <p>Pemesanan memerlukan hewan yang sudah terdaftar. Silakan hubungi admin Lana Petshop untuk mendaftarkan hewan Anda.</p>
      </div>
    );
  }

  const adaError = tampilkanError && errors.length > 0;
  return (
    <div className={`field ${adaError ? 'field--error' : ''}`}>
      <div className="pilih-grid" role="radiogroup" aria-label="Pilih hewan">
        {pets.map((p, i) => (
          <label key={p.id_pet} className={`pilihan ${String(nilai) === String(p.id_pet) ? 'pilihan--on' : ''}`}>
            <input
              type="radio"
              id={i === 0 ? 'id_pet' : undefined}
              name="id_pet"
              value={p.id_pet}
              checked={String(nilai) === String(p.id_pet)}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
            />
            <span className="pilihan__ikon" aria-hidden="true">🐾</span>
            <span>
              <strong>{p.nama_pet}</strong>
              {infoPet(p) && <small>{infoPet(p)}</small>}
            </span>
          </label>
        ))}
      </div>
      <div className="field__messages" aria-live="polite">
        {adaError && (
          <ul className="field__errors">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        )}
      </div>
    </div>
  );
}

/* --------------------------- Hasil pesanan --------------------------- */

export function HasilPesanan({ pesanan, total, rincian, onPesanLagi }) {
  return (
    <section className="hasil">
      <div className="hasil__ikon" aria-hidden="true">✓</div>
      <h2>Pesanan berhasil dibuat!</h2>
      <p className="hasil__sub">
        Nomor pesanan <strong>#{pesanan.id_pesanan}</strong> untuk <strong>{pesanan.nama_pet}</strong>.
      </p>

      <dl className="hasil__rincian">
        {rincian.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
        <div><dt>Status</dt><dd><span className="chip chip--warn">Menunggu pembayaran</span></dd></div>
        <div className="hasil__total"><dt>Total</dt><dd>{rupiah(total)}</dd></div>
      </dl>

      <Notice tipe="info">
        Selesaikan pembayaran dengan mengunggah foto bukti. Pesanan baru diproses setelah admin memverifikasinya.
      </Notice>

      <div className="hasil__aksi">
        <button type="button" className="btn btn--ghost" onClick={onPesanLagi}>Buat pesanan lagi</button>
        <Link to="/pesanan" className="btn btn--ghost">Pesanan saya</Link>
        <Link to={`/bayar/${pesanan.id_pesanan}`} className="btn btn--primary">Bayar sekarang</Link>
      </div>
    </section>
  );
}

/* ------------------------- Khusus pelanggan -------------------------- */

export function KhususPelanggan() {
  return (
    <div className="kosong">
      <strong>Halaman ini khusus akun pelanggan.</strong>
      <p>Akun Anda tidak dapat membuat pesanan. <Link to="/home">Kembali ke Home</Link></p>
    </div>
  );
}

export function JudulHalaman({ judul, sub }) {
  return (
    <div className="judul-halaman">
      <Link to="/home" className="kembali">← Kembali</Link>
      <h1>{judul}</h1>
      <p>{sub}</p>
    </div>
  );
}
