import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import FotoBukti from '../components/FotoBukti.jsx';
import Linimasa from '../components/Linimasa.jsx';
import { Chip, Field, Modal, Notice } from '../components/ui.jsx';
import { JudulHalaman } from '../components/Pesanan.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatTanggalPendek, rupiah } from '../lib/format.js';
import { formatTanggalWaktu } from '../lib/hotel.js';
import { LABEL_PEMBAYARAN, ringkasLayanan, statusGabungan, totalPesanan } from '../lib/status.js';
import { menandaiSelesai, validasiKeteranganProgress, validasiStatusProgress } from '../lib/validators.js';
import { SARAN_PROGRESS } from '../config.js';

const TAB = [
  ['semua', 'Semua', () => true],
  ['belum_bayar', 'Belum dibayar', (k) => k === 'belum_bayar' || k === 'ditolak'],
  ['verifikasi', 'Menunggu verifikasi', (k) => k === 'verifikasi'],
  ['diproses', 'Diproses', (k) => k === 'diproses'],
  ['selesai', 'Selesai', (k) => k === 'selesai'],
  ['dibatalkan', 'Dibatalkan', (k) => k === 'dibatalkan'],
];

// Form update progres. Hanya tampil untuk pesanan berstatus DIPROSES.
function FormProgress({ p, onSimpan }) {
  const [form, setForm] = useState({ status_progress: '', keterangan: '' });
  const [sudahCoba, setSudahCoba] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sukses, setSukses] = useState('');

  const errors = { status_progress: validasiStatusProgress(form.status_progress), keterangan: validasiKeteranganProgress(form.keterangan) };
  const selesai = menandaiSelesai(form.status_progress);
  const saran = SARAN_PROGRESS[p.jenis_pesanan] ?? [];

  const ubah = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSukses('');
    setKonfirmasi(false);
  };

  const simpan = async () => {
    setLoading(true);
    setError('');
    try {
      await onSimpan({ status_progress: form.status_progress.trim(), keterangan: form.keterangan.trim() || null });
      setSukses('Update progress berhasil diperbarui.');
      setForm({ status_progress: '', keterangan: '' });
      setSudahCoba(false);
      setKonfirmasi(false);
    } catch (err) {
      setError(`Update progress gagal diperbarui: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const kirim = async (e) => {
    e.preventDefault();
    if (loading) return;
    setSudahCoba(true);
    setSukses('');
    const pertama = ['status_progress', 'keterangan'].find((f) => errors[f].length > 0);
    if (pertama) {
      document.getElementById(`prog_${pertama}`)?.focus();
      return;
    }
    if (selesai && !konfirmasi) {
      setKonfirmasi(true);
      return;
    }
    await simpan();
  };

  return (
    <form className="form" onSubmit={kirim} noValidate>
      <h3 className="sub-judul">Update progres</h3>
      {sukses && <Notice tipe="success" onClose={() => setSukses('')}>{sukses}</Notice>}
      {error && <Notice tipe="error">{error}</Notice>}

      <Field id="prog_status_progress" label="Status progres" errors={errors.status_progress} tampilkanError={sudahCoba}
        valid={errors.status_progress.length === 0} hint="Pilih dari saran atau ketik sendiri (maks. 30 karakter).">
        {(aria) => (
          <>
            <input id="prog_status_progress" name="status_progress" className="input" list="saran-progress" value={form.status_progress}
              onChange={ubah} placeholder="contoh: Sedang Dimandikan" disabled={loading} autoComplete="off" {...aria} />
            <datalist id="saran-progress">{saran.map((s) => <option key={s} value={s} />)}</datalist>
          </>
        )}
      </Field>

      <Field id="prog_keterangan" label={<>Keterangan <span className="optional">(opsional)</span></>} errors={errors.keterangan}
        tampilkanError={sudahCoba} valid={false}>
        {(aria) => (
          <textarea id="prog_keterangan" name="keterangan" className="input input--area" rows={2} value={form.keterangan} onChange={ubah}
            placeholder="Catatan untuk pelanggan" disabled={loading} {...aria} />
        )}
      </Field>

      {selesai && !konfirmasi && (
        <Notice tipe="warning">Status <strong>Selesai</strong> menutup pesanan ini. Setelah itu progres tidak dapat diubah lagi.</Notice>
      )}
      {konfirmasi ? (
        <div className="konfirmasi">
          <p>Tandai pesanan <strong>#{p.id_pesanan}</strong> sebagai selesai? Tindakan ini tidak dapat diurungkan.</p>
          <div className="periksa__aksi">
            <button type="button" className="btn btn--ghost" onClick={() => setKonfirmasi(false)} disabled={loading}>Kembali</button>
            <button type="button" className="btn btn--primary" onClick={simpan} disabled={loading}>{loading ? 'Menyimpan…' : 'Ya, tandai selesai'}</button>
          </div>
        </div>
      ) : (
        <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? 'Menyimpan…' : 'Simpan progres'}</button>
      )}
    </form>
  );
}

function DetailPesanan({ p, bayar, onTutup, onProgressBerubah }) {
  const { apiAuth } = useAuth();
  const [progress, setProgress] = useState({ status: 'loading', riwayat: [] });
  const st = statusGabungan(p, bayar);
  const hotel = p.jenis_pesanan === 'HOTEL';
  const lb = bayar ? LABEL_PEMBAYARAN[bayar.status_pembayaran] : null;

  const muatProgress = useCallback(async () => {
    try {
      const res = await apiAuth(`/progress/pesanan/${p.id_pesanan}`);
      setProgress({ status: 'ok', riwayat: res.data?.riwayat ?? [] });
    } catch (err) {
      setProgress({ status: 'error', riwayat: [], pesan: err.message });
    }
  }, [apiAuth, p.id_pesanan]);

  useEffect(() => {
    muatProgress();
  }, [muatProgress]);

  const simpan = async (body) => {
    await apiAuth(`/progress/pesanan/${p.id_pesanan}`, { method: 'POST', body });
    await muatProgress();
    await onProgressBerubah();
  };

  let ketUpdate = null;
  if (p.status_pesanan === 'MENUNGGU') {
    ketUpdate = bayar?.status_pembayaran === 'MENUNGGU'
      ? <>Progres belum bisa diperbarui: pembayaran belum terverifikasi. <Link to="/admin/pembayaran">Periksa bukti pembayaran →</Link></>
      : 'Progres belum bisa diperbarui: pelanggan belum membayar atau pembayaran belum terverifikasi.';
  } else if (p.status_pesanan === 'SELESAI' || p.status_pesanan === 'DIBATALKAN') {
    ketUpdate = 'Pesanan sudah ditutup, progres tidak dapat diperbarui lagi.';
  }

  return (
    <Modal judul={`Pesanan #${p.id_pesanan}`} onTutup={onTutup} lebar={920}>
      <div className="periksa periksa--lebar">
        <div className="periksa__info">
          <Chip tone={st.tone}>{st.label}</Chip>
          <dl className="pesanan__rincian">
            <div><dt>Pelanggan</dt><dd>{p.nama_customer}</dd></div>
            <div><dt>Layanan</dt><dd>{ringkasLayanan(p)}</dd></div>
            <div><dt>Hewan</dt><dd>{p.nama_pet}</dd></div>
            <div><dt>Dipesan</dt><dd>{formatTanggalPendek(p.tanggal_pesanan)}</dd></div>
            {hotel && (
              <>
                <div><dt>Check-in</dt><dd>{formatTanggalWaktu(p.jam_checkin)}</dd></div>
                <div><dt>Check-out</dt><dd>{formatTanggalWaktu(p.jam_checkout)}</dd></div>
              </>
            )}
            <div><dt>Pembayaran</dt><dd>{lb ? <Chip tone={lb.tone}>{lb.label}</Chip> : 'Belum ada'}</dd></div>
            {bayar && <div><dt>Metode</dt><dd>{bayar.metode_pembayaran}</dd></div>}
            <div className="pesanan__total"><dt>Total</dt><dd>{rupiah(totalPesanan(p))}</dd></div>
          </dl>
          {bayar && (
            <div>
              <h3 className="sub-judul">Bukti pembayaran</h3>
              <FotoBukti src={bayar.bukti_pembayaran} alt={`Bukti pembayaran pesanan #${p.id_pesanan}`} kecil />
              {bayar.status_pembayaran === 'MENUNGGU' && (
                <p className="ringkasan__catatan" style={{ textAlign: 'left' }}><Link to="/admin/pembayaran">Verifikasi pembayaran ini →</Link></p>
              )}
            </div>
          )}
        </div>

        <div className="periksa__info">
          <div>
            <h3 className="sub-judul">Riwayat progres</h3>
            <Linimasa state={progress} />
          </div>
          {ketUpdate ? <Notice tipe="info">{ketUpdate}</Notice> : <FormProgress key={p.id_pesanan} p={p} onSimpan={simpan} />}
        </div>
      </div>
    </Modal>
  );
}

export default function AdminPesanan() {
  const { user, apiAuth } = useAuth();
  const adalahAdmin = user.role === 'ADMIN';
  const [params] = useSearchParams();
  const tabAwal = TAB.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'semua';

  const [data, setData] = useState({ status: 'loading', pesanan: [], bayar: {}, pesan: '' });
  const [tab, setTab] = useState(tabAwal);
  const [idDipilih, setIdDipilih] = useState(null);

  const muat = useCallback(
    async (diam = false) => {
      if (!diam) setData((d) => ({ ...d, status: 'loading' }));
      try {
        const [rp, rb] = await Promise.all([apiAuth('/pesanan'), apiAuth('/pembayaran')]);
        const bayar = {};
        (Array.isArray(rb.data) ? rb.data : []).forEach((b) => { bayar[b.id_pesanan] = b; });
        setData({ status: 'ok', pesanan: Array.isArray(rp.data) ? rp.data : [], bayar, pesan: '' });
      } catch (err) {
        setData((d) => (diam && d.status === 'ok' ? d : { status: 'error', pesanan: [], bayar: {}, pesan: err.message }));
      }
    },
    [apiAuth]
  );

  useEffect(() => {
    if (adalahAdmin) muat();
  }, [adalahAdmin, muat]);

  const jumlah = useMemo(() => {
    const h = Object.fromEntries(TAB.map(([k]) => [k, 0]));
    data.pesanan.forEach((p) => {
      const kode = statusGabungan(p, data.bayar[p.id_pesanan]).kode;
      TAB.forEach(([k, , cocok]) => { if (cocok(kode)) h[k] += 1; });
    });
    return h;
  }, [data]);

  const tampil = useMemo(() => {
    const cocok = TAB.find(([k]) => k === tab)[2];
    return data.pesanan.filter((p) => cocok(statusGabungan(p, data.bayar[p.id_pesanan]).kode));
  }, [data, tab]);

  const dipilih = data.pesanan.find((p) => p.id_pesanan === idDipilih) ?? null;

  return (
    <AppShell lebar={1100}>
      <JudulHalaman judul="Semua Pesanan" sub="Pantau seluruh pesanan masuk dan perbarui progres layanan." />

      {!adalahAdmin ? (
        <div className="kosong"><strong>Halaman ini khusus admin.</strong></div>
      ) : (
        <>
          <div className="tab-bar" role="tablist" aria-label="Filter pesanan">
            {TAB.map(([k, label]) => (
              <button key={k} role="tab" type="button" aria-selected={tab === k} className={`tab ${tab === k ? 'tab--on' : ''}`} onClick={() => setTab(k)}>
                {label} <span className={`tab__jumlah ${k === 'diproses' && jumlah.diproses > 0 ? 'tab__jumlah--hot' : ''}`}>{jumlah[k]}</span>
              </button>
            ))}
            <button type="button" className="btn btn--ghost tab-bar__muat" onClick={() => muat()}>↻ Muat ulang</button>
          </div>

          {data.status === 'loading' && <div className="langkah pesanan--skeleton" style={{ minHeight: 180 }} aria-busy="true" />}
          {data.status === 'error' && (
            <Notice tipe="error">
              Gagal memuat pesanan: {data.pesan}{' '}
              <button type="button" className="link-btn" onClick={() => muat()}>Coba lagi</button>
            </Notice>
          )}
          {data.status === 'ok' && tampil.length === 0 && (
            <div className="kosong"><strong>{data.pesanan.length === 0 ? 'Belum ada pesanan.' : 'Tidak ada pesanan pada filter ini.'}</strong></div>
          )}
          {data.status === 'ok' && tampil.length > 0 && (
            <div className="tabel-wrap">
              <table className="tabel">
                <thead>
                  <tr><th>Pesanan</th><th>Pelanggan</th><th>Layanan</th><th>Hewan</th><th>Total</th><th>Status</th><th><span className="sr-only">Aksi</span></th></tr>
                </thead>
                <tbody>
                  {tampil.map((p) => {
                    const st = statusGabungan(p, data.bayar[p.id_pesanan]);
                    return (
                      <tr key={p.id_pesanan}>
                        <td><strong>#{p.id_pesanan}</strong><small>{formatTanggalPendek(p.tanggal_pesanan)}</small></td>
                        <td>{p.nama_customer}</td>
                        <td>{ringkasLayanan(p)}</td>
                        <td>{p.nama_pet}</td>
                        <td className="tabel__angka">{rupiah(totalPesanan(p))}</td>
                        <td><Chip tone={st.tone}>{st.label}</Chip></td>
                        <td>
                          <button type="button" className={`btn ${p.status_pesanan === 'DIPROSES' ? 'btn--primary' : 'btn--ghost'} btn--kecil`} onClick={() => setIdDipilih(p.id_pesanan)}>
                            {p.status_pesanan === 'DIPROSES' ? 'Update progres' : 'Detail'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {dipilih && (
        <DetailPesanan p={dipilih} bayar={data.bayar[dipilih.id_pesanan]} onTutup={() => setIdDipilih(null)} onProgressBerubah={() => muat(true)} />
      )}
    </AppShell>
  );
}
