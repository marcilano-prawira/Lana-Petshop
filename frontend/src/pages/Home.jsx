import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { Notice, PawIcon } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useSisaWaktu from '../lib/useSisaWaktu.js';
import { formatJam, rupiah, salam } from '../lib/format.js';
import { SESSION_DURATION_MS, SESSION_WARNING_MS } from '../config.js';

const MENU_CUSTOMER = [
  { ikon: '✂', judul: 'Pesan Grooming', teks: 'Pilih paket dan hewan untuk dimanjakan.', to: '/pesan-grooming' },
  { ikon: '🏠', judul: 'Pet Hotel', teks: 'Titipkan hewan kesayangan Anda.', to: '/pesan-hotel' },
  { ikon: '📋', judul: 'Pesanan Saya', teks: 'Bayar, batalkan, dan pantau progres.', to: '/pesanan' },
  { ikon: '🐾', judul: 'Hewan Saya', teks: 'Daftarkan dan kelola hewan Anda.', to: '/hewan-saya' },
  { ikon: '🏨', judul: 'Data Pet Hotel', teks: 'Lihat detail penitipan hewan Anda.', to: '/pet-hotel' },
];

const MENU_ADMIN = [
  { ikon: '🧾', judul: 'Verifikasi Pembayaran', teks: 'Periksa bukti bayar pelanggan.', to: '/admin/pembayaran', badge: 'menunggu' },
  { ikon: '📋', judul: 'Semua Pesanan', teks: 'Lihat seluruh pesanan masuk.', to: '/admin/pesanan' },
  { ikon: '⏱', judul: 'Update Progress', teks: 'Perbarui progres layanan.', to: '/admin/pesanan?tab=diproses' },
  { ikon: '✂', judul: 'Paket Grooming', teks: 'Tambah, ubah, dan hapus paket.', to: '/admin/paket' },
  { ikon: '🏨', judul: 'Pet Hotel', teks: 'Lihat dan kelola pesanan hotel.', to: '/pet-hotel' },
  { ikon: '📊', judul: 'Laporan', teks: 'Laporan penjualan bulanan.', to: '/admin/laporan' },
];

function menuUntuk(role) {
  if (role === 'CUSTOMER') return MENU_CUSTOMER;
  return MENU_ADMIN.map((m) => (role === 'ADMIN' ? m : { ...m, to: undefined, badge: undefined }));
}

function KartuMenu({ m, jumlahBadge }) {
  const isi = (
    <>
      <span className="menu-card__ikon">{m.ikon}</span>
      <h3>{m.judul}</h3>
      <p>{m.teks}</p>
    </>
  );

  if (!m.to) {
    return (
      <div className="menu-card" aria-disabled="true">
        {isi}
        <span className="menu-card__badge">Segera hadir</span>
      </div>
    );
  }
  return (
    <Link to={m.to} className="menu-card menu-card--aktif">
      {isi}
      {jumlahBadge > 0 && <span className="menu-card__badge menu-card__badge--hot">{jumlahBadge} menunggu</span>}
      <span className="menu-card__panah" aria-hidden="true">→</span>
    </Link>
  );
}

function DaftarPaket({ bisaPesan }) {
  const { apiAuth } = useAuth();
  const [status, setStatus] = useState('loading');
  const [paket, setPaket] = useState([]);
  const [pesanError, setPesanError] = useState('');

  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const res = await apiAuth('/paket-grooming');
        if (batal) return;
        setPaket(Array.isArray(res.data) ? res.data : []);
        setStatus('ok');
      } catch (err) {
        if (batal) return;
        setPesanError(err.message);
        setStatus('error');
      }
    })();
    return () => {
      batal = true;
    };
  }, [apiAuth]);

  if (status === 'loading') {
    return (
      <div className="paket-grid" aria-busy="true" aria-label="Memuat paket grooming">
        {[1, 2, 3].map((n) => <div key={n} className="paket paket--skeleton" />)}
      </div>
    );
  }
  if (status === 'error') return <Notice tipe="error">Gagal memuat paket grooming: {pesanError}</Notice>;
  if (paket.length === 0) return <p className="kosong">Belum ada paket grooming yang tersedia.</p>;

  return (
    <div className="paket-grid">
      {paket.map((p) => (
        <article key={p.id_layanan} className="paket">
          <span className="paket__jenis">{p.jenis_paket}</span>
          <h3>{p.nama_layanan}</h3>
          <p className="paket__detail">{p.detail_layanan || 'Tidak ada detail layanan.'}</p>
          <p className="paket__harga">{rupiah(p.harga_paket)}</p>
          {bisaPesan && (
            <Link to={`/pesan-grooming?paket=${p.id_layanan}`} className="btn btn--ghost paket__pesan">
              Pesan paket ini
            </Link>
          )}
        </article>
      ))}
    </div>
  );
}

export default function Home() {
  const { user, sesi, apiAuth } = useAuth();
  const sisa = useSisaWaktu(sesi.expiresAt);
  const [menunggu, setMenunggu] = useState(0);

  // Admin: hitung pembayaran yang menunggu verifikasi untuk lencana di menu
  useEffect(() => {
    if (user.role !== 'ADMIN') return undefined;
    let batal = false;
    apiAuth('/pembayaran')
      .then((res) => {
        if (!batal && Array.isArray(res.data)) setMenunggu(res.data.filter((b) => b.status_pembayaran === 'MENUNGGU').length);
      })
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, [apiAuth, user.role]);
  const hampirHabis = sisa <= SESSION_WARNING_MS;
  const persen = Math.min(100, (sisa / SESSION_DURATION_MS) * 100);

  return (
    <AppShell>
      <section className="hero">
        <div>
          <p className="hero__salam">{salam()},</p>
          <h1>{user.nama || user.username}!</h1>
          <p className="hero__teks">Care, Love &amp; Happiness for Every Pet. Apa yang bisa kami bantu hari ini?</p>
        </div>
        <div className="hero__sesi">
          <p>Sesi berakhir pukul <strong>{formatJam(sesi.expiresAt)}</strong></p>
          <div className="progress" aria-hidden="true">
            <span className={hampirHabis ? 'progress--warn' : ''} style={{ width: `${persen}%` }} />
          </div>
        </div>
        <PawIcon size={220} className="hero__paw" />
      </section>

      <section>
        <h2 className="section-title">{user.role === 'CUSTOMER' ? 'Layanan kami' : 'Menu pengelola'}</h2>
        <div className="menu-grid">
          {menuUntuk(user.role).map((m) => <KartuMenu key={m.judul} m={m} jumlahBadge={m.badge === 'menunggu' ? menunggu : 0} />)}
        </div>
      </section>

      <section>
        <h2 className="section-title">Paket grooming</h2>
        <DaftarPaket bisaPesan={user.role === 'CUSTOMER'} />
      </section>
    </AppShell>
  );
}
