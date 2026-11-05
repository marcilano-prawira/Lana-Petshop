import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { Chip, Field, Modal, Notice } from '../components/ui.jsx';
import { JudulHalaman } from '../components/Pesanan.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { rupiah } from '../lib/format.js';
import { formatTanggalWaktu, hitungDurasiHari, hitungTotalHotel, keInputLokal } from '../lib/hotel.js';
import { LABEL_PESANAN } from '../lib/status.js';
import { validasiCheckinAdmin, validasiCheckout } from '../lib/validators.js';

const totalHotel = (h) => hitungTotalHotel(h.jam_checkin, h.jam_checkout, h.tarif_per_hari);
const AlasanTerkunci = 'Tidak dapat diubah/dihapus karena pesanan sudah memiliki pembayaran.';

function DetailHotel({ h, admin, onTutup }) {
  const st = LABEL_PESANAN[h.status_pesanan];
  return (
    <Modal judul={`Detail pet hotel · Pesanan #${h.id_pesanan}`} onTutup={onTutup} lebar={560}>
      <dl className="pesanan__rincian">
        <div><dt>Pesanan</dt><dd>#{h.id_pesanan}</dd></div>
        {admin && <div><dt>Pelanggan</dt><dd>{h.nama_customer}</dd></div>}
        <div><dt>Hewan</dt><dd>{h.nama_pet}</dd></div>
        <div><dt>Check-in</dt><dd>{formatTanggalWaktu(h.jam_checkin)}</dd></div>
        <div><dt>Check-out</dt><dd>{formatTanggalWaktu(h.jam_checkout)}</dd></div>
        <div><dt>Durasi</dt><dd>{hitungDurasiHari(h.jam_checkin, h.jam_checkout)} hari</dd></div>
        <div><dt>Tarif per hari</dt><dd>{rupiah(h.tarif_per_hari)}</dd></div>
        <div><dt>Status pesanan</dt><dd>{st ? <Chip tone={st.tone}>{st.label}</Chip> : h.status_pesanan}</dd></div>
        <div className="pesanan__total"><dt>Total</dt><dd>{rupiah(totalHotel(h))}</dd></div>
      </dl>
      {!admin && (
        <p className="ringkasan__catatan"><Link to="/pesanan">Lihat pembayaran dan progres di Pesanan Saya →</Link></p>
      )}
      <div className="modal__aksi"><button type="button" className="btn btn--ghost" onClick={onTutup}>Tutup</button></div>
    </Modal>
  );
}

function EditHotel({ h, onTutup, onSimpan }) {
  const [form, setForm] = useState({ checkin: keInputLokal(new Date(h.jam_checkin)), checkout: keInputLokal(new Date(h.jam_checkout)) });
  const [touched, setTouched] = useState({});
  const [sudahCoba, setSudahCoba] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const errors = { checkin: validasiCheckinAdmin(form.checkin), checkout: validasiCheckout(form.checkin, form.checkout) };
  const tampil = (f) => sudahCoba || Boolean(touched[f]);
  const valid = errors.checkin.length === 0 && errors.checkout.length === 0;
  const baru = valid ? hitungTotalHotel(form.checkin, form.checkout, h.tarif_per_hari) : null;

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
    const pertama = ['checkin', 'checkout'].find((f) => errors[f].length > 0);
    if (pertama) {
      document.getElementById(pertama)?.focus();
      return;
    }
    setLoading(true);
    try {
      await onSimpan({ jam_checkin: new Date(form.checkin).toISOString(), jam_checkout: new Date(form.checkout).toISOString() });
    } catch (err) {
      setError(`Gagal memperbarui: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <Modal judul={`Ubah jadwal · Pesanan #${h.id_pesanan}`} onTutup={onTutup} lebar={560} kunci={loading}>
      <form className="form" onSubmit={kirim} noValidate>
        <p className="ringkasan__catatan" style={{ textAlign: 'left' }}>{h.nama_customer} · {h.nama_pet}</p>
        {error && <Notice tipe="error">{error}</Notice>}
        <div className="form form--grid">
          <Field id="checkin" label="Check-in" errors={errors.checkin} tampilkanError={tampil('checkin')} valid={errors.checkin.length === 0}>
            {(aria) => <input id="checkin" name="checkin" type="datetime-local" className="input" value={form.checkin} onChange={ubah} onBlur={blur} disabled={loading} {...aria} />}
          </Field>
          <Field id="checkout" label="Check-out" errors={errors.checkout} tampilkanError={tampil('checkout')} valid={errors.checkout.length === 0}>
            {(aria) => <input id="checkout" name="checkout" type="datetime-local" className="input" value={form.checkout} min={form.checkin || undefined} onChange={ubah} onBlur={blur} disabled={loading} {...aria} />}
          </Field>
        </div>
        <dl className="pesanan__rincian">
          <div><dt>Total sebelumnya</dt><dd>{rupiah(totalHotel(h))}</dd></div>
          <div className="pesanan__total"><dt>Total setelah diubah</dt><dd>{baru !== null ? rupiah(baru) : '—'}</dd></div>
        </dl>
        <div className="modal__aksi">
          <button type="button" className="btn btn--ghost" onClick={onTutup} disabled={loading}>Batal</button>
          <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? 'Menyimpan…' : 'Simpan perubahan'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function PetHotel() {
  const { user, apiAuth } = useAuth();
  const admin = user.role === 'ADMIN';

  const [data, setData] = useState({ status: 'loading', daftar: [], bayar: {}, pesan: '' });
  const [detail, setDetail] = useState(null);
  const [edit, setEdit] = useState(null);
  const [hapusTarget, setHapusTarget] = useState(null);
  const [menghapus, setMenghapus] = useState(false);
  const [errHapus, setErrHapus] = useState('');
  const [notice, setNotice] = useState(null);

  const muat = useCallback(
    async (diam = false) => {
      if (!diam) setData((d) => ({ ...d, status: 'loading' }));
      try {
        const res = await apiAuth('/pet-hotel');
        // Admin: cek pembayaran agar tombol ubah/hapus nonaktif untuk pesanan yang sudah dibayar
        const bayar = {};
        if (admin) {
          try {
            const rb = await apiAuth('/pembayaran');
            (Array.isArray(rb.data) ? rb.data : []).forEach((b) => { bayar[b.id_pesanan] = b; });
          } catch {
            // jika gagal, server tetap menolak perubahan yang tidak diizinkan
          }
        }
        setData({ status: 'ok', daftar: Array.isArray(res.data) ? res.data : [], bayar, pesan: '' });
      } catch (err) {
        setData((d) => (diam && d.status === 'ok' ? d : { status: 'error', daftar: [], bayar: {}, pesan: err.message }));
      }
    },
    [apiAuth, admin]
  );

  useEffect(() => {
    muat();
  }, [muat]);

  const urut = useMemo(() => [...data.daftar].sort((a, b) => new Date(b.jam_checkin) - new Date(a.jam_checkin)), [data.daftar]);

  const simpan = async (body) => {
    await apiAuth(`/pet-hotel/${edit.id_hotel}`, { method: 'PUT', body });
    setNotice({ tipe: 'success', teks: `Data pesanan hotel #${edit.id_pesanan} berhasil diperbarui.` });
    setEdit(null);
    await muat(true);
  };

  const hapus = async () => {
    if (!hapusTarget || menghapus) return;
    setMenghapus(true);
    setErrHapus('');
    try {
      await apiAuth(`/pet-hotel/${hapusTarget.id_hotel}`, { method: 'DELETE' });
      setNotice({ tipe: 'success', teks: `Berhasil terhapus: pesanan hotel #${hapusTarget.id_pesanan} (${hapusTarget.nama_pet}).` });
      setHapusTarget(null);
      await muat(true);
    } catch (err) {
      setErrHapus(err.status === 409 ? err.message : `Gagal menghapus: ${err.message}`);
    } finally {
      setMenghapus(false);
    }
  };

  return (
    <AppShell lebar={1100}>
      <JudulHalaman
        judul="Data Pet Hotel"
        sub={admin ? 'Lihat dan kelola seluruh pesanan penitipan hewan.' : 'Lihat detail pesanan penitipan hewan Anda.'}
      />

      {notice && <Notice tipe={notice.tipe} onClose={() => setNotice(null)}>{notice.teks}</Notice>}

      <div className="tab-bar">
        {!admin && <Link to="/pesan-hotel" className="btn btn--primary">+ Pesan pet hotel</Link>}
        <button type="button" className="btn btn--ghost tab-bar__muat" onClick={() => muat()}>↻ Muat ulang</button>
      </div>

      {data.status === 'loading' && <div className="langkah pesanan--skeleton" style={{ minHeight: 180 }} aria-busy="true" />}
      {data.status === 'error' && (
        <Notice tipe="error" judul="Gagal memuat halaman">
          Data pet hotel tidak dapat dimuat: {data.pesan}{' '}
          <button type="button" className="link-btn" onClick={() => muat()}>Coba lagi</button>
        </Notice>
      )}
      {data.status === 'ok' && urut.length === 0 && (
        <div className="kosong">
          <strong>Belum ada pesanan pet hotel.</strong>
          {!admin && <p><Link to="/pesan-hotel">Pesan pet hotel</Link> sekarang.</p>}
        </div>
      )}
      {data.status === 'ok' && urut.length > 0 && (
        <div className="tabel-wrap">
          <table className="tabel">
            <thead>
              <tr>
                <th>Pesanan</th>{admin && <th>Pelanggan</th>}<th>Hewan</th><th>Check-in</th><th>Check-out</th><th>Total</th><th>Status</th><th><span className="sr-only">Aksi</span></th>
              </tr>
            </thead>
            <tbody>
              {urut.map((h) => {
                const st = LABEL_PESANAN[h.status_pesanan];
                const terkunci = Boolean(data.bayar[h.id_pesanan]);
                return (
                  <tr key={h.id_hotel}>
                    <td><strong>#{h.id_pesanan}</strong><small>{h.id_hotel}</small></td>
                    {admin && <td>{h.nama_customer}</td>}
                    <td>{h.nama_pet}</td>
                    <td>{formatTanggalWaktu(h.jam_checkin)}</td>
                    <td>{formatTanggalWaktu(h.jam_checkout)}</td>
                    <td className="tabel__angka">{rupiah(totalHotel(h))}</td>
                    <td>{st ? <Chip tone={st.tone}>{st.label}</Chip> : h.status_pesanan}</td>
                    <td>
                      <div className="aksi-baris">
                        <button type="button" className="btn btn--ghost btn--kecil" onClick={() => setDetail(h)}>Detail</button>
                        {admin && (
                          <>
                            <button type="button" className="btn btn--ghost btn--kecil" disabled={terkunci} title={terkunci ? AlasanTerkunci : undefined} onClick={() => setEdit(h)}>Ubah</button>
                            <button type="button" className="btn btn--bahaya btn--kecil" disabled={terkunci} title={terkunci ? AlasanTerkunci : undefined} onClick={() => { setErrHapus(''); setHapusTarget(h); }}>Hapus</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {detail && <DetailHotel h={detail} admin={admin} onTutup={() => setDetail(null)} />}
      {edit && <EditHotel h={edit} onTutup={() => setEdit(null)} onSimpan={simpan} />}

      {hapusTarget && (
        <Modal judul="Hapus pesanan hotel?" onTutup={() => setHapusTarget(null)} lebar={480} kunci={menghapus}>
          <p>
            Pesanan hotel <strong>#{hapusTarget.id_pesanan}</strong> milik <strong>{hapusTarget.nama_customer}</strong> ({hapusTarget.nama_pet}) akan
            dihapus beserta catatan progresnya. Tindakan ini tidak dapat diurungkan.
          </p>
          {errHapus && <Notice tipe="error">{errHapus}</Notice>}
          <div className="modal__aksi">
            <button type="button" className="btn btn--ghost" onClick={() => setHapusTarget(null)} disabled={menghapus}>Tidak</button>
            <button type="button" className="btn btn--bahaya-solid" onClick={hapus} disabled={menghapus}>
              {menghapus ? 'Menghapus…' : 'Hapus data sekarang'}
            </button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
