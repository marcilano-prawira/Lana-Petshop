import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { Avatar, Field, Notice, PasswordInput } from '../components/ui.jsx';
import { JudulHalaman } from '../components/Pesanan.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { NAMA_ROLE } from '../lib/format.js';
import { formatUkuran, kompresFotoProfil, periksaFileBukti } from '../lib/gambar.js';
import { validasiAlamat, validasiPasswordLogin, validasiUsername } from '../lib/validators.js';

const ROLE_BERALAMAT = ['CUSTOMER', 'ADMIN']; // sama dengan Profil.ROLE_BERALAMAT di backend
const FOTO_AWAL = { mode: 'tetap', status: 'idle', alasan: [] }; // mode: tetap | hapus | baru

export default function Profil() {
  const { user, apiAuth, perbaruiProfil } = useAuth();
  const beralamat = ROLE_BERALAMAT.includes(user.role);

  const [muat, setMuat] = useState({ status: 'loading', data: null, pesan: '' });
  const [form, setForm] = useState({ username: '', alamat: '', password: '' });
  const [foto, setFoto] = useState(FOTO_AWAL);
  const [touched, setTouched] = useState({});
  const [sudahCoba, setSudahCoba] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorServer, setErrorServer] = useState('');
  const [errPasswordServer, setErrPasswordServer] = useState('');
  const [usernameDipakai, setUsernameDipakai] = useState('');
  const [sukses, setSukses] = useState([]);

  const isiDariServer = (d) => {
    setForm({ username: d.username, alamat: d.alamat ?? '', password: '' });
    setFoto(FOTO_AWAL);
    setTouched({});
    setSudahCoba(false);
    setUsernameDipakai('');
    setErrPasswordServer('');
  };

  const muatProfil = async () => {
    setMuat((m) => ({ ...m, status: 'loading' }));
    try {
      const res = await apiAuth('/auth/saya');
      setMuat({ status: 'ok', data: res.data, pesan: '' });
      isiDariServer(res.data);
    } catch (err) {
      setMuat({ status: 'error', data: null, pesan: err.message });
    }
  };

  useEffect(() => {
    muatProfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = muat.data;
  const usernameBerubah = data ? form.username !== data.username : false;
  const alamatBerubah = data && beralamat ? form.alamat.trim() !== (data.alamat ?? '').trim() : false;
  const fotoBerubah = foto.mode !== 'tetap';
  const adaPerubahan = usernameBerubah || alamatBerubah || fotoBerubah;

  // Hanya kolom yang diubah yang divalidasi, agar data lama tidak memblokir perubahan lain.
  const errors = {
    username: usernameBerubah
      ? [
          ...validasiUsername(form.username, { mode: 'register' }),
          ...(usernameDipakai && usernameDipakai === form.username
            ? [`Username "${form.username}" sudah digunakan. Pilih username lain.`]
            : []),
        ]
      : [],
    alamat: alamatBerubah ? validasiAlamat(form.alamat) : [],
    password: usernameBerubah
      ? [...validasiPasswordLogin(form.password), ...(errPasswordServer ? [errPasswordServer] : [])]
      : [],
  };
  const tampil = (f) => sudahCoba || Boolean(touched[f]);

  const ubah = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrorServer('');
    setSukses([]);
    if (name === 'password') setErrPasswordServer('');
  };
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const pilihFoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorServer('');
    setSukses([]);
    setFoto({ mode: 'tetap', status: 'memproses', alasan: [] });

    const alasan = await periksaFileBukti(file);
    if (alasan.length) {
      setFoto({ mode: 'tetap', status: 'error', alasan });
      return;
    }
    try {
      const hasil = await kompresFotoProfil(file);
      setFoto({ mode: 'baru', status: 'idle', alasan: [], nama: file.name, ...hasil });
    } catch (err) {
      setFoto({ mode: 'tetap', status: 'error', alasan: [err.message] });
    }
  };

  const fotoTampil = foto.mode === 'baru' ? foto.dataUrl : foto.mode === 'hapus' ? null : data?.foto_profil;
  const adaFotoTersimpan = Boolean(data?.foto_profil) || foto.mode === 'baru';

  const kirim = async (e) => {
    e.preventDefault();
    if (loading || foto.status === 'memproses') return;
    setSudahCoba(true);
    setErrorServer('');
    setSukses([]);
    if (!adaPerubahan) return;

    const pertama = ['username', 'password', 'alamat'].find((f) => errors[f].length > 0);
    if (pertama) {
      document.getElementById(pertama)?.focus();
      return;
    }

    const body = {};
    if (usernameBerubah) {
      body.username = form.username;
      body.password_saat_ini = form.password;
    }
    if (alamatBerubah) body.alamat = form.alamat.trim() || null;
    if (fotoBerubah) body.foto_profil = foto.mode === 'hapus' ? null : foto.dataUrl;

    setLoading(true);
    try {
      const res = await apiAuth('/auth/profil', { method: 'PATCH', body });
      const ringkas = [];
      if (fotoBerubah) ringkas.push(foto.mode === 'hapus' ? 'Foto profil dihapus.' : 'Foto profil diperbarui.');
      if (alamatBerubah) ringkas.push(body.alamat ? 'Alamat diperbarui.' : 'Alamat dikosongkan.');
      if (usernameBerubah) ringkas.push(`Username diganti menjadi "${res.data.username}". Gunakan username baru ini saat login berikutnya.`);

      perbaruiProfil(res.data);
      setMuat({ status: 'ok', data: res.data, pesan: '' });
      isiDariServer(res.data);
      setSukses(ringkas);
      window.scrollTo?.({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err.status === 409) {
        setUsernameDipakai(form.username);
        document.getElementById('username')?.focus();
      } else if (err.status === 403 && usernameBerubah) {
        setErrPasswordServer(err.message);
        document.getElementById('password')?.focus();
      } else {
        setErrorServer(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const batalkan = () => {
    if (data) isiDariServer(data);
    setErrorServer('');
  };

  return (
    <AppShell lebar={820}>
      <JudulHalaman judul="Profil Saya" sub="Ubah foto, alamat, dan username akun Anda." />

      {muat.status === 'loading' && <div className="langkah pesanan--skeleton" style={{ minHeight: 260 }} aria-busy="true" />}
      {muat.status === 'error' && (
        <Notice tipe="error">
          Gagal memuat profil: {muat.pesan}{' '}
          <button type="button" className="link-btn" onClick={muatProfil}>Coba lagi</button>
        </Notice>
      )}

      {muat.status === 'ok' && (
        <form className="profil" onSubmit={kirim} noValidate>
          {sukses.length > 0 && (
            <Notice tipe="success" judul="Profil berhasil disimpan" onClose={() => setSukses([])}>
              {sukses.map((s) => <div key={s}>{s}</div>)}
            </Notice>
          )}
          {errorServer && <Notice tipe="error">{errorServer}</Notice>}

          <section className="langkah profil__foto">
            <div className="profil__avatar">
              <Avatar foto={fotoTampil} nama={data.nama || data.username} ukuran={120} />
              {foto.mode === 'baru' && <span className="profil__belum">Belum disimpan</span>}
              {foto.mode === 'hapus' && <span className="profil__belum">Akan dihapus</span>}
            </div>
            <div className="profil__foto-info">
              <h2>Foto profil</h2>
              <p>JPG, PNG, atau WEBP. Foto dipotong persegi dari bagian tengah dan dikecilkan otomatis.</p>
              {foto.mode === 'baru' && (
                <small>{foto.nama} · {foto.ukuran}×{foto.ukuran} px · {formatUkuran(foto.byte)} setelah dikompres</small>
              )}
              <div className="profil__foto-aksi">
                <label htmlFor="foto-profil" className="btn btn--ghost">
                  {foto.status === 'memproses' ? 'Memproses…' : adaFotoTersimpan ? 'Ganti foto' : 'Pilih foto'}
                  <input
                    id="foto-profil"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={pilihFoto}
                    disabled={loading || foto.status === 'memproses'}
                  />
                </label>
                {adaFotoTersimpan && foto.mode !== 'hapus' && (
                  <button type="button" className="btn btn--bahaya" onClick={() => setFoto({ mode: 'hapus', status: 'idle', alasan: [] })} disabled={loading}>
                    Hapus foto
                  </button>
                )}
                {foto.mode !== 'tetap' && (
                  <button type="button" className="btn btn--ghost" onClick={() => setFoto(FOTO_AWAL)} disabled={loading}>
                    Batalkan
                  </button>
                )}
              </div>
              {foto.status === 'error' && (
                <ul className="field__errors" aria-live="polite">
                  {foto.alasan.map((a) => <li key={a}>{a}</li>)}
                </ul>
              )}
            </div>
          </section>

          <section className="langkah">
            <h2>Informasi akun</h2>
            <dl className="pesanan__rincian">
              <div><dt>Nama</dt><dd>{data.nama || '—'}</dd></div>
              <div><dt>Peran</dt><dd>{NAMA_ROLE[data.role] || data.role}</dd></div>
              {data.no_hp_customer && <div><dt>Nomor HP</dt><dd>{data.no_hp_customer}</dd></div>}
            </dl>
          </section>

          <section className="langkah">
            <h2>Ubah data</h2>
            <div className="form">
              <Field
                id="username"
                label="Username"
                errors={errors.username}
                tampilkanError={tampil('username')}
                valid={usernameBerubah && errors.username.length === 0}
                hint="Huruf kecil, angka, titik, underscore. 4–50 karakter. Dipakai untuk login."
              >
                {(aria) => (
                  <input id="username" name="username" className="input" value={form.username} onChange={ubah} onBlur={blur}
                    autoComplete="username" autoCapitalize="off" spellCheck={false} disabled={loading} {...aria} />
                )}
              </Field>

              {usernameBerubah && (
                <Field
                  id="password"
                  label="Password saat ini"
                  errors={errors.password}
                  tampilkanError={tampil('password')}
                  valid={false}
                  hint="Diperlukan untuk memastikan ini benar-benar Anda, karena username dipakai untuk login."
                >
                  {(aria) => (
                    <PasswordInput id="password" nilai={form.password} onChange={ubah} onBlur={blur} autoComplete="current-password"
                      placeholder="Masukkan password Anda" ariaProps={aria} disabled={loading} />
                  )}
                </Field>
              )}

              {beralamat && (
                <Field
                  id="alamat"
                  label={<>Alamat <span className="optional">(boleh dikosongkan)</span></>}
                  errors={errors.alamat}
                  tampilkanError={tampil('alamat')}
                  valid={alamatBerubah && errors.alamat.length === 0}
                  hint={`${form.alamat.trim().length}/255 karakter`}
                >
                  {(aria) => (
                    <textarea id="alamat" name="alamat" className="input input--area" rows={3} value={form.alamat} onChange={ubah}
                      onBlur={blur} placeholder="Jalan, nomor, kota" disabled={loading} {...aria} />
                  )}
                </Field>
              )}
            </div>
          </section>

          <div className="profil__simpan">
            <span className={adaPerubahan ? 'profil__status profil__status--ubah' : 'profil__status'}>
              {adaPerubahan ? 'Ada perubahan yang belum disimpan' : 'Belum ada perubahan'}
            </span>
            <div className="profil__simpan-aksi">
              <button type="button" className="btn btn--ghost" onClick={batalkan} disabled={!adaPerubahan || loading}>Batalkan perubahan</button>
              <button type="submit" className="btn btn--primary" disabled={!adaPerubahan || loading || foto.status === 'memproses'}>
                {loading ? 'Menyimpan…' : 'Simpan perubahan'}
              </button>
            </div>
          </div>
        </form>
      )}
    </AppShell>
  );
}
