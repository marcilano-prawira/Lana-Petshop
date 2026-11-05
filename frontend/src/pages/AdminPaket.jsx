import { useCallback, useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { Chip, Field, Modal, Notice } from '../components/ui.jsx';
import { JudulHalaman } from '../components/Pesanan.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { rupiah } from '../lib/format.js';
import { JENIS_PAKET } from '../config.js';
import { validasiDetailPaket, validasiHargaPaket, validasiJenisPaket, validasiNamaPaket } from '../lib/validators.js';

const KOSONG = { nama_layanan: '', jenis_paket: '', detail_layanan: '', harga_paket: '' };
const FIELD = ['nama_layanan', 'jenis_paket', 'harga_paket', 'detail_layanan'];

// Form tambah / ubah paket. `paket` = null untuk tambah.
function FormPaket({ paket, onTutup, onSimpan }) {
  const [form, setForm] = useState(() =>
    paket
      ? {
          nama_layanan: paket.nama_layanan ?? '',
          jenis_paket: paket.jenis_paket ?? '',
          detail_layanan: paket.detail_layanan ?? '',
          harga_paket: String(Math.round(Number(paket.harga_paket) || 0)),
        }
      : KOSONG
  );
  const [touched, setTouched] = useState({});
  const [sudahCoba, setSudahCoba] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const errors = {
    nama_layanan: validasiNamaPaket(form.nama_layanan),
    jenis_paket: validasiJenisPaket(form.jenis_paket),
    harga_paket: validasiHargaPaket(form.harga_paket),
    detail_layanan: validasiDetailPaket(form.detail_layanan),
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
    const pertama = FIELD.find((f) => errors[f].length > 0);
    if (pertama) {
      document.getElementById(pertama)?.focus();
      return;
    }
    setLoading(true);
    try {
      await onSimpan({
        nama_layanan: form.nama_layanan.trim(),
        jenis_paket: form.jenis_paket.trim(),
        detail_layanan: form.detail_layanan.trim() || null,
        harga_paket: Number(form.harga_paket),
      });
    } catch (err) {
      setError(`${paket ? 'Daftar paket gagal diubah' : 'Daftar paket terbaru gagal ditambahkan'}: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <Modal judul={paket ? `Ubah paket: ${paket.nama_layanan}` : 'Tambah paket grooming'} onTutup={onTutup} lebar={560} kunci={loading}>
      <form className="form" onSubmit={kirim} noValidate>
        {error && <Notice tipe="error">{error}</Notice>}

        <Field id="nama_layanan" label="Nama paket" errors={errors.nama_layanan} tampilkanError={tampil('nama_layanan')} valid={errors.nama_layanan.length === 0}>
          {(aria) => (
            <input id="nama_layanan" name="nama_layanan" className="input" value={form.nama_layanan} onChange={ubah} onBlur={blur}
              placeholder="contoh: Grooming Lengkap" disabled={loading} {...aria} />
          )}
        </Field>

        <Field id="jenis_paket" label="Jenis paket" errors={errors.jenis_paket} tampilkanError={tampil('jenis_paket')} valid={errors.jenis_paket.length === 0}
          hint="Pilih dari saran atau ketik jenis lain.">
          {(aria) => (
            <>
              <input id="jenis_paket" name="jenis_paket" className="input" list="saran-jenis-paket" value={form.jenis_paket} onChange={ubah} onBlur={blur}
                placeholder="contoh: Premium" disabled={loading} {...aria} />
              <datalist id="saran-jenis-paket">{JENIS_PAKET.map((j) => <option key={j} value={j} />)}</datalist>
            </>
          )}
        </Field>

        <Field id="harga_paket" label="Harga (Rp)" errors={errors.harga_paket} tampilkanError={tampil('harga_paket')} valid={errors.harga_paket.length === 0}>
          {(aria) => (
            <input id="harga_paket" name="harga_paket" className="input" inputMode="numeric" value={form.harga_paket} onChange={ubah} onBlur={blur}
              placeholder="contoh: 100000" disabled={loading} {...aria} />
          )}
        </Field>

        <Field id="detail_layanan" label={<>Detail layanan <span className="optional">(opsional)</span></>} errors={errors.detail_layanan}
          tampilkanError={tampil('detail_layanan')} valid={false}>
          {(aria) => (
            <textarea id="detail_layanan" name="detail_layanan" className="input input--area" rows={3} value={form.detail_layanan} onChange={ubah} onBlur={blur}
              placeholder="contoh: Mandi, potong bulu, potong kuku, bersih telinga" disabled={loading} {...aria} />
          )}
        </Field>

        <div className="modal__aksi">
          <button type="button" className="btn btn--ghost" onClick={onTutup} disabled={loading}>Batal</button>
          <button type="submit" className="btn btn--primary" disabled={loading}>{loading ? 'Menyimpan…' : paket ? 'Simpan perubahan' : 'Simpan paket'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminPaket() {
  const { user, apiAuth } = useAuth();
  const adalahAdmin = user.role === 'ADMIN';

  const [data, setData] = useState({ status: 'loading', daftar: [], pesan: '' });
  const [form, setForm] = useState(null); // null | 'baru' | objek paket
  const [hapusTarget, setHapusTarget] = useState(null);
  const [menghapus, setMenghapus] = useState(false);
  const [errHapus, setErrHapus] = useState('');
  const [notice, setNotice] = useState(null);

  const muat = useCallback(
    async (diam = false) => {
      if (!diam) setData((d) => ({ ...d, status: 'loading' }));
      try {
        const res = await apiAuth('/paket-grooming');
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
    if (form === 'baru') {
      await apiAuth('/paket-grooming', { method: 'POST', body });
      setNotice({ tipe: 'success', teks: `Daftar paket terbaru berhasil ditambahkan: ${body.nama_layanan}.` });
    } else {
      await apiAuth(`/paket-grooming/${form.id_layanan}`, { method: 'PUT', body });
      setNotice({ tipe: 'success', teks: `Daftar paket berhasil diubah: ${body.nama_layanan}.` });
    }
    setForm(null);
    await muat(true);
  };

  const hapus = async () => {
    if (!hapusTarget || menghapus) return;
    setMenghapus(true);
    setErrHapus('');
    try {
      await apiAuth(`/paket-grooming/${hapusTarget.id_layanan}`, { method: 'DELETE' });
      setNotice({ tipe: 'success', teks: `Berhasil terhapus: ${hapusTarget.nama_layanan}.` });
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
      <JudulHalaman judul="Paket Grooming" sub="Kelola daftar paket yang tampil bagi pelanggan." />

      {!adalahAdmin ? (
        <div className="kosong"><strong>Halaman ini khusus admin.</strong></div>
      ) : (
        <>
          {notice && <Notice tipe={notice.tipe} onClose={() => setNotice(null)}>{notice.teks}</Notice>}

          <div className="tab-bar">
            <button type="button" className="btn btn--primary" onClick={() => setForm('baru')}>+ Tambah paket baru</button>
            <button type="button" className="btn btn--ghost tab-bar__muat" onClick={() => muat()}>↻ Muat ulang</button>
          </div>

          {data.status === 'loading' && <div className="langkah pesanan--skeleton" style={{ minHeight: 180 }} aria-busy="true" />}
          {data.status === 'error' && (
            <Notice tipe="error">
              Gagal memuat daftar paket: {data.pesan}{' '}
              <button type="button" className="link-btn" onClick={() => muat()}>Coba lagi</button>
            </Notice>
          )}
          {data.status === 'ok' && data.daftar.length === 0 && (
            <div className="kosong">
              <strong>Belum ada paket grooming.</strong>
              <p>Tambahkan paket pertama agar pelanggan bisa memesan.</p>
            </div>
          )}
          {data.status === 'ok' && data.daftar.length > 0 && (
            <div className="tabel-wrap">
              <table className="tabel">
                <thead>
                  <tr><th>Paket</th><th>Jenis</th><th>Harga</th><th><span className="sr-only">Aksi</span></th></tr>
                </thead>
                <tbody>
                  {data.daftar.map((p) => (
                    <tr key={p.id_layanan}>
                      <td><strong>{p.nama_layanan}</strong><small>{p.detail_layanan || 'Tidak ada detail.'}</small></td>
                      <td><Chip tone="muted">{p.jenis_paket}</Chip></td>
                      <td className="tabel__angka">{rupiah(p.harga_paket)}</td>
                      <td>
                        <div className="aksi-baris">
                          <button type="button" className="btn btn--ghost btn--kecil" onClick={() => setForm(p)}>Ubah</button>
                          <button type="button" className="btn btn--bahaya btn--kecil" onClick={() => { setErrHapus(''); setHapusTarget(p); }}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {form && <FormPaket paket={form === 'baru' ? null : form} onTutup={() => setForm(null)} onSimpan={simpan} />}

      {hapusTarget && (
        <Modal judul="Hapus paket?" onTutup={() => setHapusTarget(null)} lebar={480} kunci={menghapus}>
          <p>
            Paket <strong>{hapusTarget.nama_layanan}</strong> ({rupiah(hapusTarget.harga_paket)}) akan dihapus. Tindakan ini tidak dapat diurungkan.
            Paket yang sudah pernah dipesan tidak dapat dihapus.
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
