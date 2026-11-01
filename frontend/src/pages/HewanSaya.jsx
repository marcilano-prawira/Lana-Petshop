import { useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { Field, Notice } from '../components/ui.jsx';
import { JudulHalaman, KhususPelanggan, usePetSaya } from '../components/Pesanan.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { JENIS_HEWAN } from '../config.js';
import { validasiJenisHewan, validasiNamaHewan, validasiRasHewan } from '../lib/validators.js';

const AWAL = { nama_pet: '', jenis_pet: '', ras_pet: '' };

export default function HewanSaya() {
  const { user, apiAuth } = useAuth();
  const petData = usePetSaya();

  const [form, setForm] = useState(AWAL);
  const [touched, setTouched] = useState({});
  const [sudahCoba, setSudahCoba] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorServer, setErrorServer] = useState('');
  const [sukses, setSukses] = useState('');

  const errors = {
    nama_pet: validasiNamaHewan(form.nama_pet),
    jenis_pet: validasiJenisHewan(form.jenis_pet, JENIS_HEWAN),
    ras_pet: validasiRasHewan(form.ras_pet),
  };
  const tampil = (f) => sudahCoba || Boolean(touched[f]);

  const ubah = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrorServer('');
    setSukses('');
  };
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const kirim = async (e) => {
    e.preventDefault();
    if (loading) return;
    setSudahCoba(true);
    setErrorServer('');
    setSukses('');

    const pertama = ['nama_pet', 'jenis_pet', 'ras_pet'].find((f) => errors[f].length > 0);
    if (pertama) {
      document.getElementById(pertama)?.focus();
      return;
    }

    setLoading(true);
    try {
      await apiAuth('/pesanan/pet-saya', {
        method: 'POST',
        body: {
          nama_pet: form.nama_pet.trim(),
          jenis_pet: form.jenis_pet,
          ras_pet: form.ras_pet.trim() || null,
        },
      });
      setSukses(`${form.nama_pet.trim()} berhasil didaftarkan.`);
      setForm(AWAL);
      setTouched({});
      setSudahCoba(false);
      petData.muat();
    } catch (err) {
      setErrorServer(
        err.status === 404 || err.status === 405
          ? 'Server belum mendukung penambahan hewan (endpoint POST /pesanan/pet-saya belum tersedia di backend).'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const info = (p) => [p.jenis_pet ?? p.jenis_hewan, p.ras_pet ?? p.ras].filter(Boolean).join(' · ');

  return (
    <AppShell lebar={1100}>
      <JudulHalaman judul="Hewan Saya" sub="Daftarkan hewan kesayangan Anda agar bisa dipesankan layanan." />

      {user.role !== 'CUSTOMER' ? (
        <KhususPelanggan />
      ) : (
        <div className="pesan-layout pesan-layout--lebar-kiri">
          <section className="langkah">
            <h2>Hewan terdaftar</h2>
            {petData.status === 'loading' && (
              <div className="pilih-grid" aria-busy="true">
                {[1, 2].map((n) => <div key={n} className="pilihan pilihan--skeleton" />)}
              </div>
            )}
            {petData.status === 'error' && (
              <Notice tipe="error">
                Gagal memuat daftar hewan: {petData.pesan}{' '}
                <button type="button" className="link-btn" onClick={petData.muat}>Coba lagi</button>
              </Notice>
            )}
            {petData.status === 'ok' && petData.pets.length === 0 && (
              <p className="kosong">Belum ada hewan terdaftar. Tambahkan hewan pertama Anda di samping.</p>
            )}
            {petData.status === 'ok' && petData.pets.length > 0 && (
              <ul className="daftar-hewan">
                {petData.pets.map((p) => (
                  <li key={p.id_pet}>
                    <span className="pilihan__ikon" aria-hidden="true">🐾</span>
                    <div>
                      <strong>{p.nama_pet}</strong>
                      {info(p) && <small>{info(p)}</small>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form className="ringkasan ringkasan--form" onSubmit={kirim} noValidate>
            <h2>Tambah hewan</h2>
            {sukses && <Notice tipe="success" onClose={() => setSukses('')}>{sukses}</Notice>}
            {errorServer && <Notice tipe="error">{errorServer}</Notice>}

            <div className="form">
              <Field id="nama_pet" label="Nama hewan" errors={errors.nama_pet} tampilkanError={tampil('nama_pet')} valid={errors.nama_pet.length === 0}>
                {(aria) => (
                  <input id="nama_pet" name="nama_pet" className="input" value={form.nama_pet} onChange={ubah} onBlur={blur}
                    placeholder="contoh: Mochi" disabled={loading} {...aria} />
                )}
              </Field>

              <Field id="jenis_pet" label="Jenis hewan" errors={errors.jenis_pet} tampilkanError={tampil('jenis_pet')} valid={errors.jenis_pet.length === 0}>
                {(aria) => (
                  <select id="jenis_pet" name="jenis_pet" className="input" value={form.jenis_pet} onChange={ubah} onBlur={blur}
                    disabled={loading} {...aria}>
                    <option value="">Pilih jenis…</option>
                    {JENIS_HEWAN.map((j) => <option key={j} value={j}>{j}</option>)}
                  </select>
                )}
              </Field>

              <Field
                id="ras_pet"
                label={<>Ras <span className="optional">(opsional)</span></>}
                errors={errors.ras_pet}
                tampilkanError={tampil('ras_pet')}
                valid={form.ras_pet.trim().length > 0 && errors.ras_pet.length === 0}
              >
                {(aria) => (
                  <input id="ras_pet" name="ras_pet" className="input" value={form.ras_pet} onChange={ubah} onBlur={blur}
                    placeholder="contoh: Persia" disabled={loading} {...aria} />
                )}
              </Field>

              <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
                {loading ? 'Menyimpan…' : 'Simpan hewan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
