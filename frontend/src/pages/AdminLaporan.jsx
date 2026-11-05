import { useCallback, useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { Chip, Field, Modal, Notice } from '../components/ui.jsx';
import { JudulHalaman } from '../components/Pesanan.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { NAMA_BULAN, formatTanggalJam, formatTanggalPendek, namaPeriode, rupiah } from '../lib/format.js';
import { validasiBulan, validasiPeriodeLaporan, validasiTahun } from '../lib/validators.js';

function FormLaporan({ onTutup, onSimpan }) {
  const sekarang = new Date();
  const [form, setForm] = useState({ bulan: String(sekarang.getMonth() + 1), tahun: String(sekarang.getFullYear()) });
  const [sudahCoba, setSudahCoba] = useState(false);
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const errors = {
    bulan: validasiBulan(form.bulan),
    tahun: [...validasiTahun(form.tahun), ...validasiPeriodeLaporan(form.bulan, form.tahun)],
  };
  const tampil = (f) => sudahCoba || Boolean(touched[f]);
  const ubah = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const kirim = async (e) => {
    e.preventDefault();
    if (loading) return;
    setSudahCoba(true);
    setError('');
    const pertama = ['bulan', 'tahun'].find((f) => errors[f].length > 0);
    if (pertama) {
      document.getElementById(pertama)?.focus();
      return;
    }
    setLoading(true);
    try {
      await onSimpan({ bulan: Number(form.bulan), tahun: Number(form.tahun) });
    } catch (err) {
      setError(err.status === 409 ? err.message : `Gagal menyimpan laporan terbaru: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <Modal judul="Buat laporan bulanan" onTutup={onTutup} lebar={520} kunci={loading}>
      <form className="form" onSubmit={kirim} noValidate>
        {error && <Notice tipe="error">{error}</Notice>}
        <div className="form form--grid">
          <Field id="bulan" label="Bulan" errors={errors.bulan} tampilkanError={tampil('bulan')} valid={errors.bulan.length === 0}>
            {(aria) => (
              <select id="bulan" name="bulan" className="input" value={form.bulan} onChange={ubah} onBlur={blur} disabled={loading} {...aria}>
                {NAMA_BULAN.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
              </select>
            )}
          </Field>
          <Field id="tahun" label="Tahun" errors={errors.tahun} tampilkanError={tampil('tahun')} valid={errors.tahun.length === 0}>
            {(aria) => (
              <input id="tahun" name="tahun" className="input" inputMode="numeric" maxLength={4} value={form.tahun} onChange={ubah} onBlur={blur} disabled={loading} {...aria} />
            )}
          </Field>
        </div>
        <p className="ringkasan__catatan" style={{ textAlign: 'left' }}>
          Laporan dihitung otomatis dari pesanan pada bulan tersebut yang pembayarannya sudah terverifikasi (pesanan yang dibatalkan tidak dihitung).
        </p>
        <div className="modal__aksi">
          <button type="button" className="btn btn--ghost" onClick={onTutup} disabled={loading}>Batal</button>
          <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? 'Menyimpan…' : 'Buat laporan'}</button>
        </div>
      </form>
    </Modal>
  );
}

function DetailLaporan({ id, onTutup }) {
  const { apiAuth } = useAuth();
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const res = await apiAuth(`/laporan/${id}`);
        if (!batal) setState({ status: 'ok', data: res.data });
      } catch (err) {
        if (!batal) setState({ status: 'error', pesan: err.message });
      }
    })();
    return () => { batal = true; };
  }, [apiAuth, id]);

  const l = state.status === 'ok' ? state.data : null;

  return (
    <Modal judul={l ? `Laporan ${namaPeriode(l.bulan, l.tahun)}` : 'Detail laporan'} onTutup={onTutup} lebar={900}>
      {state.status === 'loading' && <p aria-busy="true">Memuat laporan…</p>}
      {state.status === 'error' && <Notice tipe="error">Gagal memuat laporan: {state.pesan}</Notice>}
      {l && (
        <>
          <dl className="pesanan__rincian">
            <div><dt>Periode</dt><dd>{namaPeriode(l.bulan, l.tahun)}</dd></div>
            <div><dt>Total pesanan</dt><dd>{l.total_pesanan}</dd></div>
            <div><dt>Dibuat</dt><dd>{formatTanggalJam(l.created_at)}</dd></div>
            <div className="pesanan__total"><dt>Total pendapatan</dt><dd>{rupiah(l.total_pendapatan)}</dd></div>
          </dl>
          {(l.detail ?? []).length === 0 ? (
            <div className="kosong" style={{ marginTop: 16 }}><strong>Tidak ada pesanan terverifikasi pada periode ini.</strong></div>
          ) : (
            <div className="tabel-wrap" style={{ marginTop: 16 }}>
              <table className="tabel">
                <thead><tr><th>Pesanan</th><th>Tanggal</th><th>Pelanggan</th><th>Layanan</th><th>Status</th><th>Total</th></tr></thead>
                <tbody>
                  {l.detail.map((d) => (
                    <tr key={d.id_pesanan}>
                      <td><strong>#{d.id_pesanan}</strong></td>
                      <td>{formatTanggalPendek(d.tanggal_pesanan)}</td>
                      <td>{d.nama_customer}</td>
                      <td>{d.jenis_pesanan === 'HOTEL' ? 'Pet Hotel' : `Grooming · ${d.nama_layanan}`}</td>
                      <td><Chip tone={d.status_pesanan === 'SELESAI' ? 'ok' : 'info'}>{d.status_pesanan === 'SELESAI' ? 'Selesai' : 'Diproses'}</Chip></td>
                      <td className="tabel__angka">{rupiah(d.total_harga)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <div className="modal__aksi">
        <button type="button" className="btn btn--ghost" onClick={() => window.print()} disabled={!l}>Cetak</button>
        <button type="button" className="btn btn--primary" onClick={onTutup}>Tutup</button>
      </div>
    </Modal>
  );
}

export default function AdminLaporan() {
  const { user, apiAuth } = useAuth();
  const adalahAdmin = user.role === 'ADMIN';

  const [data, setData] = useState({ status: 'loading', daftar: [], pesan: '' });
  const [buat, setBuat] = useState(false);
  const [idDetail, setIdDetail] = useState(null);
  const [notice, setNotice] = useState(null);

  const muat = useCallback(
    async (diam = false) => {
      if (!diam) setData((d) => ({ ...d, status: 'loading' }));
      try {
        const res = await apiAuth('/laporan');
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

  const simpan = async (body) => {
    const res = await apiAuth('/laporan', { method: 'POST', body });
    setBuat(false);
    setNotice({ tipe: 'success', teks: `Laporan terbaru berhasil ditambahkan: ${namaPeriode(body.bulan, body.tahun)}.` });
    await muat(true);
    if (res.data?.id_laporan) setIdDetail(res.data.id_laporan);
  };

  return (
    <AppShell lebar={1100}>
      <JudulHalaman judul="Laporan Penjualan" sub="Laporan bulanan operasional Lana Petshop." />

      {!adalahAdmin ? (
        <div className="kosong"><strong>Halaman ini khusus admin.</strong></div>
      ) : (
        <>
          {notice && <Notice tipe={notice.tipe} onClose={() => setNotice(null)}>{notice.teks}</Notice>}

          <div className="tab-bar">
            <button type="button" className="btn btn--primary" onClick={() => setBuat(true)}>+ Buat laporan baru</button>
            <button type="button" className="btn btn--ghost tab-bar__muat" onClick={() => muat()}>↻ Muat ulang</button>
          </div>

          {data.status === 'loading' && <div className="langkah pesanan--skeleton" style={{ minHeight: 180 }} aria-busy="true" />}
          {data.status === 'error' && (
            <Notice tipe="error">
              Gagal memuat laporan: {data.pesan}{' '}
              <button type="button" className="link-btn" onClick={() => muat()}>Coba lagi</button>
            </Notice>
          )}
          {data.status === 'ok' && data.daftar.length === 0 && (
            <div className="kosong"><strong>Belum ada laporan.</strong><p>Buat laporan pertama untuk bulan yang sudah berjalan.</p></div>
          )}
          {data.status === 'ok' && data.daftar.length > 0 && (
            <div className="tabel-wrap">
              <table className="tabel">
                <thead><tr><th>Periode</th><th>Total pesanan</th><th>Total pendapatan</th><th>Dibuat</th><th><span className="sr-only">Aksi</span></th></tr></thead>
                <tbody>
                  {data.daftar.map((l) => (
                    <tr key={l.id_laporan}>
                      <td><strong>{namaPeriode(l.bulan, l.tahun)}</strong><small>{l.id_laporan}</small></td>
                      <td>{l.total_pesanan}</td>
                      <td className="tabel__angka">{rupiah(l.total_pendapatan)}</td>
                      <td>{formatTanggalJam(l.created_at)}</td>
                      <td><button type="button" className="btn btn--ghost btn--kecil" onClick={() => setIdDetail(l.id_laporan)}>Lihat detail</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {buat && <FormLaporan onTutup={() => setBuat(false)} onSimpan={simpan} />}
      {idDetail && <DetailLaporan id={idDetail} onTutup={() => setIdDetail(null)} />}
    </AppShell>
  );
}
