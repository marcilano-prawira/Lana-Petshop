import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { Chip, Modal, Notice } from '../components/ui.jsx';
import Linimasa from '../components/Linimasa.jsx';
import { JudulHalaman, KhususPelanggan } from '../components/Pesanan.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatTanggalPendek, rupiah } from '../lib/format.js';
import { formatTanggalWaktu } from '../lib/hotel.js';
import { ringkasLayanan, statusGabungan, totalPesanan } from '../lib/status.js';

const FILTER = [
  ['semua', 'Semua', () => true],
  ['tindakan', 'Perlu tindakan', (k) => k === 'belum_bayar' || k === 'ditolak'],
  ['berjalan', 'Berjalan', (k) => k === 'verifikasi' || k === 'diproses'],
  ['selesai', 'Selesai', (k) => k === 'selesai'],
  ['dibatalkan', 'Dibatalkan', (k) => k === 'dibatalkan'],
];

function KartuPesanan({ p, bayar, terbuka, progress, onToggle, onBatal }) {
  const st = statusGabungan(p, bayar);
  const hotel = p.jenis_pesanan === 'HOTEL';

  return (
    <article className={`pesanan ${st.kode === 'ditolak' ? 'pesanan--ditolak' : ''}`}>
      <header className="pesanan__kepala">
        <div>
          <h3>Pesanan #{p.id_pesanan}</h3>
          <p>{ringkasLayanan(p)} · {formatTanggalPendek(p.tanggal_pesanan)}</p>
        </div>
        <Chip tone={st.tone}>{st.label}</Chip>
      </header>

      <dl className="pesanan__rincian">
        <div><dt>Hewan</dt><dd>{p.nama_pet}</dd></div>
        {hotel && (
          <>
            <div><dt>Check-in</dt><dd>{formatTanggalWaktu(p.jam_checkin)}</dd></div>
            <div><dt>Check-out</dt><dd>{formatTanggalWaktu(p.jam_checkout)}</dd></div>
          </>
        )}
        <div className="pesanan__total"><dt>Total</dt><dd>{rupiah(totalPesanan(p))}</dd></div>
      </dl>

      {st.kode === 'ditolak' && (
        <Notice tipe="error" judul="Bukti pembayaran ditolak">
          Admin tidak dapat memverifikasi bukti Anda. Kirim ulang foto bukti yang jelas dan sesuai nominal.
        </Notice>
      )}
      {st.kode === 'verifikasi' && (
        <Notice tipe="info">Bukti pembayaran sudah diterima dan sedang diperiksa admin.</Notice>
      )}

      <footer className="pesanan__aksi">
        <button type="button" className="btn btn--ghost" onClick={onToggle} aria-expanded={terbuka}>
          {terbuka ? 'Sembunyikan progres' : 'Lihat progres'}
        </button>
        <div className="pesanan__aksi-kanan">
          {st.bisaBatal && (
            <button type="button" className="btn btn--bahaya" onClick={onBatal}>Batalkan</button>
          )}
          {!st.bisaBatal && st.alasanTidakBisaBatal && (
            <span className="pesanan__catatan" title={st.alasanTidakBisaBatal}>Tidak dapat dibatalkan</span>
          )}
          {st.bisaBayar && (
            <Link to={`/bayar/${p.id_pesanan}`} className="btn btn--primary">
              {st.kode === 'ditolak' ? 'Kirim ulang bukti' : 'Bayar sekarang'}
            </Link>
          )}
          {!st.bisaBayar && bayar && (
            <Link to={`/bayar/${p.id_pesanan}`} className="btn btn--ghost">Lihat pembayaran</Link>
          )}
        </div>
      </footer>

      {terbuka && <div className="pesanan__progres"><Linimasa state={progress} /></div>}
    </article>
  );
}

export default function PesananSaya() {
  const { user, apiAuth } = useAuth();
  const adalahCustomer = user.role === 'CUSTOMER';

  const [data, setData] = useState({ status: 'loading', pesanan: [], bayar: {}, pesan: '' });
  const [filter, setFilter] = useState('semua');
  const [notice, setNotice] = useState(null);
  const [terbuka, setTerbuka] = useState(null);
  const [progress, setProgress] = useState({});
  const [batalTarget, setBatalTarget] = useState(null);
  const [membatalkan, setMembatalkan] = useState(false);
  const [errBatal, setErrBatal] = useState('');

  const muat = useCallback(
    async (diam = false) => {
      if (!diam) setData((d) => ({ ...d, status: 'loading' }));
      try {
        const [rp, rb] = await Promise.all([apiAuth('/pesanan'), apiAuth('/pembayaran')]);
        const bayar = {};
        (Array.isArray(rb.data) ? rb.data : []).forEach((b) => {
          bayar[b.id_pesanan] = b;
        });
        setData({ status: 'ok', pesanan: Array.isArray(rp.data) ? rp.data : [], bayar, pesan: '' });
      } catch (err) {
        setData((d) => (diam && d.status === 'ok' ? d : { status: 'error', pesanan: [], bayar: {}, pesan: err.message }));
      }
    },
    [apiAuth]
  );

  useEffect(() => {
    if (adalahCustomer) muat();
  }, [adalahCustomer, muat]);

  // Saat tab kembali aktif, segarkan status (mis. admin baru memverifikasi pembayaran)
  useEffect(() => {
    if (!adalahCustomer) return undefined;
    const saatTampil = () => document.visibilityState === 'visible' && muat(true);
    document.addEventListener('visibilitychange', saatTampil);
    return () => document.removeEventListener('visibilitychange', saatTampil);
  }, [adalahCustomer, muat]);

  const muatProgress = async (id) => {
    setProgress((s) => ({ ...s, [id]: { status: 'loading', riwayat: [] } }));
    try {
      const res = await apiAuth(`/progress/pesanan/${id}`);
      setProgress((s) => ({ ...s, [id]: { status: 'ok', riwayat: res.data?.riwayat ?? [] } }));
    } catch (err) {
      setProgress((s) => ({ ...s, [id]: { status: 'error', riwayat: [], pesan: err.message } }));
    }
  };

  const toggle = (id) => {
    if (terbuka === id) {
      setTerbuka(null);
      return;
    }
    setTerbuka(id);
    muatProgress(id);
  };

  const batalkan = async () => {
    if (!batalTarget || membatalkan) return;
    setMembatalkan(true);
    setErrBatal('');
    try {
      await apiAuth(`/pesanan/${batalTarget.id_pesanan}/batal`, { method: 'PATCH' });
      setNotice({ tipe: 'success', teks: `Pesanan #${batalTarget.id_pesanan} berhasil dibatalkan.` });
      setBatalTarget(null);
      await muat(true);
    } catch (err) {
      setErrBatal(err.message);
      if (err.status === 409) muat(true);
    } finally {
      setMembatalkan(false);
    }
  };

  const terhitung = useMemo(() => {
    const hasil = Object.fromEntries(FILTER.map(([k]) => [k, 0]));
    data.pesanan.forEach((p) => {
      const kode = statusGabungan(p, data.bayar[p.id_pesanan]).kode;
      FILTER.forEach(([k, , cocok]) => {
        if (cocok(kode)) hasil[k] += 1;
      });
    });
    return hasil;
  }, [data]);

  const tampil = data.pesanan.filter((p) => {
    const cocok = FILTER.find(([k]) => k === filter)[2];
    return cocok(statusGabungan(p, data.bayar[p.id_pesanan]).kode);
  });

  return (
    <AppShell lebar={1000}>
      <JudulHalaman judul="Pesanan Saya" sub="Pantau status pembayaran dan progres layanan hewan Anda." />

      {!adalahCustomer ? (
        <KhususPelanggan />
      ) : (
        <>
          {notice && <Notice tipe={notice.tipe} onClose={() => setNotice(null)}>{notice.teks}</Notice>}

          <div className="tab-bar" role="tablist" aria-label="Filter pesanan">
            {FILTER.map(([k, label]) => (
              <button key={k} role="tab" type="button" aria-selected={filter === k}
                className={`tab ${filter === k ? 'tab--on' : ''}`} onClick={() => setFilter(k)}>
                {label} <span className="tab__jumlah">{terhitung[k]}</span>
              </button>
            ))}
            <button type="button" className="btn btn--ghost tab-bar__muat" onClick={() => muat()}>↻ Muat ulang</button>
          </div>

          {data.status === 'loading' && (
            <div className="daftar-pesanan" aria-busy="true">
              {[1, 2].map((n) => <div key={n} className="pesanan pesanan--skeleton" />)}
            </div>
          )}
          {data.status === 'error' && (
            <Notice tipe="error">
              Gagal memuat pesanan: {data.pesan}{' '}
              <button type="button" className="link-btn" onClick={() => muat()}>Coba lagi</button>
            </Notice>
          )}
          {data.status === 'ok' && tampil.length === 0 && (
            <div className="kosong">
              <strong>{data.pesanan.length === 0 ? 'Belum ada pesanan.' : 'Tidak ada pesanan pada filter ini.'}</strong>
              {data.pesanan.length === 0 && (
                <p><Link to="/pesan-grooming">Pesan grooming</Link> atau <Link to="/pesan-hotel">pesan pet hotel</Link> sekarang.</p>
              )}
            </div>
          )}
          {data.status === 'ok' && tampil.length > 0 && (
            <div className="daftar-pesanan">
              {tampil.map((p) => (
                <KartuPesanan
                  key={p.id_pesanan}
                  p={p}
                  bayar={data.bayar[p.id_pesanan]}
                  terbuka={terbuka === p.id_pesanan}
                  progress={progress[p.id_pesanan]}
                  onToggle={() => toggle(p.id_pesanan)}
                  onBatal={() => {
                    setErrBatal('');
                    setBatalTarget(p);
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {batalTarget && (
        <Modal judul="Batalkan pesanan?" onTutup={() => setBatalTarget(null)} lebar={480} kunci={membatalkan}>
          <p>
            Pesanan <strong>#{batalTarget.id_pesanan}</strong> ({ringkasLayanan(batalTarget)} untuk {batalTarget.nama_pet}) akan
            dibatalkan. Tindakan ini tidak dapat diurungkan.
          </p>
          {errBatal && <Notice tipe="error">{errBatal}</Notice>}
          <div className="modal__aksi">
            <button type="button" className="btn btn--ghost" onClick={() => setBatalTarget(null)} disabled={membatalkan}>Kembali</button>
            <button type="button" className="btn btn--bahaya-solid" onClick={batalkan} disabled={membatalkan}>
              {membatalkan ? 'Membatalkan…' : 'Ya, batalkan pesanan'}
            </button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
