import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import FotoBukti from '../components/FotoBukti.jsx';
import { Chip, Modal, Notice } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatTanggalJam, rupiah } from '../lib/format.js';
import { formatTanggalWaktu } from '../lib/hotel.js';
import { LABEL_PEMBAYARAN, ringkasLayanan } from '../lib/status.js';

const TAB = [
  ['MENUNGGU', 'Menunggu verifikasi'],
  ['TERVERIFIKASI', 'Terverifikasi'],
  ['DITOLAK', 'Ditolak'],
  ['SEMUA', 'Semua'],
];

function PeriksaPembayaran({ pembayaran: b, onTutup, onSelesai }) {
  const { apiAuth } = useAuth();
  const [pesanan, setPesanan] = useState({ status: 'loading' });
  const [tahap, setTahap] = useState('awal'); // awal | terima | tolak
  const [setuju, setSetuju] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const menunggu = b.status_pembayaran === 'MENUNGGU';

  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const res = await apiAuth(`/pesanan/${b.id_pesanan}`);
        if (!batal) setPesanan({ status: 'ok', data: res.data });
      } catch (err) {
        if (!batal) setPesanan({ status: 'error', pesan: err.message });
      }
    })();
    return () => {
      batal = true;
    };
  }, [apiAuth, b.id_pesanan]);

  const proses = async (status) => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiAuth(`/pembayaran/${b.id_pembayaran}/verifikasi`, {
        method: 'PATCH',
        body: { status_pembayaran: status },
      });
      onSelesai(status, res.data);
    } catch (err) {
      setError(err.message);
      if (err.status === 409) onSelesai(null, null); // sudah diverifikasi pihak lain: segarkan daftar
    } finally {
      setLoading(false);
    }
  };

  const p = pesanan.status === 'ok' ? pesanan.data : null;

  return (
    <Modal judul={`Periksa pembayaran #${b.id_pembayaran}`} onTutup={onTutup} lebar={980} kunci={loading}>
      <div className="periksa">
        <div className="periksa__foto">
          <FotoBukti src={b.bukti_pembayaran} alt={`Bukti pembayaran #${b.id_pembayaran}`} />
        </div>

        <div className="periksa__info">
          <div className="periksa__status">
            <Chip tone={LABEL_PEMBAYARAN[b.status_pembayaran]?.tone}>{LABEL_PEMBAYARAN[b.status_pembayaran]?.label ?? b.status_pembayaran}</Chip>
          </div>

          <dl className="pesanan__rincian">
            <div><dt>Pelanggan</dt><dd>{b.nama_customer}</dd></div>
            <div><dt>Pesanan</dt><dd>#{b.id_pesanan}</dd></div>
            {pesanan.status === 'loading' && <div><dt>Layanan</dt><dd>Memuat…</dd></div>}
            {pesanan.status === 'error' && <div><dt>Layanan</dt><dd>Gagal dimuat</dd></div>}
            {p && (
              <>
                <div><dt>Layanan</dt><dd>{ringkasLayanan(p)}</dd></div>
                <div><dt>Hewan</dt><dd>{p.nama_pet}</dd></div>
                {p.jenis_pesanan === 'HOTEL' && (
                  <div><dt>Jadwal</dt><dd>{formatTanggalWaktu(p.jam_checkin)} → {formatTanggalWaktu(p.jam_checkout)}</dd></div>
                )}
              </>
            )}
            <div><dt>Metode</dt><dd>{b.metode_pembayaran}</dd></div>
            <div><dt>Dikirim</dt><dd>{formatTanggalJam(b.tanggal_bayar)}</dd></div>
            {b.tanggal_verifikasi && <div><dt>Diverifikasi</dt><dd>{formatTanggalJam(b.tanggal_verifikasi)}</dd></div>}
            <div className="pesanan__total"><dt>Nominal seharusnya</dt><dd>{rupiah(b.total_harga)}</dd></div>
          </dl>

          {error && <Notice tipe="error">{error}</Notice>}

          {menunggu && tahap === 'awal' && (
            <div className="periksa__aksi">
              <button type="button" className="btn btn--bahaya" onClick={() => setTahap('tolak')}>Tolak</button>
              <button type="button" className="btn btn--primary" onClick={() => setTahap('terima')}>Terima pembayaran</button>
            </div>
          )}

          {menunggu && tahap === 'terima' && (
            <div className="konfirmasi">
              <label className="centang">
                <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} disabled={loading} />
                <span>Saya sudah memeriksa foto: nominal <strong>{rupiah(b.total_harga)}</strong>, tanggal, dan penerima sudah sesuai.</span>
              </label>
              <div className="periksa__aksi">
                <button type="button" className="btn btn--ghost" onClick={() => { setTahap('awal'); setSetuju(false); }} disabled={loading}>Kembali</button>
                <button type="button" className="btn btn--primary" disabled={!setuju || loading} onClick={() => proses('TERVERIFIKASI')}>
                  {loading ? 'Memproses…' : 'Ya, verifikasi'}
                </button>
              </div>
            </div>
          )}

          {menunggu && tahap === 'tolak' && (
            <div className="konfirmasi konfirmasi--bahaya">
              <p>Pembayaran akan <strong>ditolak</strong> dan pelanggan wajib mengirim ulang foto bukti. Lanjutkan?</p>
              <div className="periksa__aksi">
                <button type="button" className="btn btn--ghost" onClick={() => setTahap('awal')} disabled={loading}>Kembali</button>
                <button type="button" className="btn btn--bahaya-solid" disabled={loading} onClick={() => proses('DITOLAK')}>
                  {loading ? 'Memproses…' : 'Ya, tolak pembayaran'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function AdminPembayaran() {
  const { user, apiAuth } = useAuth();
  const adalahAdmin = user.role === 'ADMIN';

  const [data, setData] = useState({ status: 'loading', daftar: [], pesan: '' });
  const [tab, setTab] = useState('MENUNGGU');
  const [dipilih, setDipilih] = useState(null);
  const [notice, setNotice] = useState(null);

  const muat = useCallback(
    async (diam = false) => {
      if (!diam) setData((d) => ({ ...d, status: 'loading' }));
      try {
        const res = await apiAuth('/pembayaran');
        setData({ status: 'ok', daftar: Array.isArray(res.data) ? res.data : [], pesan: '' });
      } catch (err) {
        setData((d) => (diam && d.status === 'ok' ? d : { status: 'error', daftar: [], pesan: err.message }));
      }
    },
    [apiAuth]
  );

  useEffect(() => {
    if (adalahAdmin) muat();
  }, [adalahAdmin, muat]);

  const jumlah = useMemo(() => {
    const h = { MENUNGGU: 0, TERVERIFIKASI: 0, DITOLAK: 0, SEMUA: data.daftar.length };
    data.daftar.forEach((b) => {
      if (h[b.status_pembayaran] !== undefined) h[b.status_pembayaran] += 1;
    });
    return h;
  }, [data.daftar]);

  const tampil = useMemo(() => {
    const hasil = data.daftar.filter((b) => tab === 'SEMUA' || b.status_pembayaran === tab);
    // Antrean: yang paling lama menunggu ditampilkan lebih dulu
    return [...hasil].sort((a, b) =>
      tab === 'MENUNGGU' ? new Date(a.tanggal_bayar) - new Date(b.tanggal_bayar) : new Date(b.tanggal_bayar) - new Date(a.tanggal_bayar)
    );
  }, [data.daftar, tab]);

  const selesai = async (status, hasil) => {
    if (status === null) {
      setDipilih(null);
      setNotice({ tipe: 'warning', teks: 'Pembayaran ini sudah diverifikasi sebelumnya. Daftar diperbarui.' });
      await muat(true);
      return;
    }
    const id = dipilih.id_pembayaran;
    setDipilih(null);
    setNotice(
      status === 'TERVERIFIKASI'
        ? { tipe: 'success', teks: `Pembayaran #${id} diverifikasi. Pesanan #${dipilih.id_pesanan} kini diproses.` }
        : { tipe: 'warning', teks: `Pembayaran #${id} ditolak. Pelanggan diminta mengirim ulang bukti.` }
    );
    // pakai data dari server bila ada, jika tidak ubah status secara lokal
    setData((d) => ({
      ...d,
      daftar: d.daftar.map((b) => (b.id_pembayaran === id ? { ...b, ...(hasil ?? {}), status_pembayaran: status } : b)),
    }));
    muat(true);
  };

  return (
    <AppShell lebar={1100}>
      <div className="judul-halaman">
        <Link to="/home" className="kembali">← Kembali</Link>
        <h1>Verifikasi Pembayaran</h1>
        <p>Periksa foto bukti dari pelanggan. Pembayaran baru berhasil setelah Anda mengonfirmasinya.</p>
      </div>

      {!adalahAdmin ? (
        <div className="kosong">
          <strong>Halaman ini khusus admin.</strong>
          <p><Link to="/home">Kembali ke Home</Link></p>
        </div>
      ) : (
        <>
          {notice && <Notice tipe={notice.tipe} onClose={() => setNotice(null)}>{notice.teks}</Notice>}

          <div className="tab-bar" role="tablist" aria-label="Filter pembayaran">
            {TAB.map(([k, label]) => (
              <button key={k} role="tab" type="button" aria-selected={tab === k} className={`tab ${tab === k ? 'tab--on' : ''}`} onClick={() => setTab(k)}>
                {label} <span className={`tab__jumlah ${k === 'MENUNGGU' && jumlah.MENUNGGU > 0 ? 'tab__jumlah--hot' : ''}`}>{jumlah[k]}</span>
              </button>
            ))}
            <button type="button" className="btn btn--ghost tab-bar__muat" onClick={() => muat()}>↻ Muat ulang</button>
          </div>

          {data.status === 'loading' && <div className="langkah pesanan--skeleton" style={{ minHeight: 180 }} aria-busy="true" />}
          {data.status === 'error' && (
            <Notice tipe="error">
              Gagal memuat pembayaran: {data.pesan}{' '}
              <button type="button" className="link-btn" onClick={() => muat()}>Coba lagi</button>
            </Notice>
          )}
          {data.status === 'ok' && tampil.length === 0 && (
            <div className="kosong">
              <strong>{tab === 'MENUNGGU' ? 'Tidak ada pembayaran yang menunggu verifikasi.' : 'Tidak ada data pada filter ini.'}</strong>
            </div>
          )}
          {data.status === 'ok' && tampil.length > 0 && (
            <div className="tabel-wrap">
              <table className="tabel">
                <thead>
                  <tr>
                    <th>Bukti</th><th>Pembayaran</th><th>Pelanggan</th><th>Metode</th><th>Nominal</th><th>Dikirim</th><th>Status</th><th><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody>
                  {tampil.map((b) => (
                    <tr key={b.id_pembayaran}>
                      <td><FotoBukti src={b.bukti_pembayaran} alt={`Bukti pembayaran #${b.id_pembayaran}`} kecil /></td>
                      <td><strong>#{b.id_pembayaran}</strong><small>Pesanan #{b.id_pesanan}</small></td>
                      <td>{b.nama_customer}</td>
                      <td>{b.metode_pembayaran}</td>
                      <td className="tabel__angka">{rupiah(b.total_harga)}</td>
                      <td>{formatTanggalJam(b.tanggal_bayar)}</td>
                      <td><Chip tone={LABEL_PEMBAYARAN[b.status_pembayaran]?.tone}>{LABEL_PEMBAYARAN[b.status_pembayaran]?.label ?? b.status_pembayaran}</Chip></td>
                      <td>
                        <button type="button" className={`btn ${b.status_pembayaran === 'MENUNGGU' ? 'btn--primary' : 'btn--ghost'} btn--kecil`} onClick={() => setDipilih(b)}>
                          {b.status_pembayaran === 'MENUNGGU' ? 'Periksa' : 'Lihat'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {dipilih && <PeriksaPembayaran pembayaran={dipilih} onTutup={() => setDipilih(null)} onSelesai={selesai} />}
    </AppShell>
  );
}
