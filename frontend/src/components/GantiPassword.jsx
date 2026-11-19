import { useEffect, useState } from 'react';
import { Field, Notice, PasswordInput } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  skorPassword,
  validasiKonfirmasiPassword,
  validasiPasswordBaruBerbeda,
  validasiPasswordLama,
  validasiPasswordRegistrasi,
} from '../lib/validators.js';

const LABEL_KEKUATAN = ['Belum diisi', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'];

function aturanPassword(p, username) {
  const u = (username || '').trim().toLowerCase();
  return [
    { label: 'Minimal 8 karakter', ok: p.length >= 8 },
    { label: 'Huruf kecil (a–z)', ok: /[a-z]/.test(p) },
    { label: 'Huruf kapital (A–Z)', ok: /[A-Z]/.test(p) },
    { label: 'Angka (0–9)', ok: /[0-9]/.test(p) },
    { label: 'Simbol (! @ # $ %)', ok: /[^A-Za-z0-9\s]/.test(p) },
    { label: 'Tanpa spasi', ok: p.length > 0 && !/\s/.test(p) },
    { label: 'Tidak memuat username', ok: p.length > 0 && !(u.length >= 4 && p.toLowerCase().includes(u)) },
  ];
}

/**
 * Ganti password dua langkah:
 *  1. password lama diverifikasi ke server (POST /auth/password/verifikasi)
 *  2. jika benar, form password baru dibuka; saat disimpan (PUT /auth/password) server memeriksa
 *     password lama sekali lagi. Setelah berhasil, semua sesi berakhir dan pengguna kembali ke login.
 */
export default function GantiPassword() {
  const { user, apiAuth, keluar } = useAuth();

  const [tahap, setTahap] = useState('verifikasi'); // 'verifikasi' | 'baru'
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [touched, setTouched] = useState({});
  const [cobaLama, setCobaLama] = useState(false);
  const [cobaBaru, setCobaBaru] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errLamaServer, setErrLamaServer] = useState('');
  const [errorServer, setErrorServer] = useState('');

  useEffect(() => {
    if (tahap === 'baru') document.getElementById('password_baru')?.focus();
  }, [tahap]);

  const errLama = [...validasiPasswordLama(lama), ...(errLamaServer ? [errLamaServer] : [])];
  const errBaru = [...validasiPasswordRegistrasi(baru, user?.username), ...validasiPasswordBaruBerbeda(lama, baru)];
  const errKonf = validasiKonfirmasiPassword(baru, konfirmasi);
  const skor = skorPassword(baru);
  const aturan = aturanPassword(baru, user?.username);
  const tampil = (f) => cobaBaru || Boolean(touched[f]);
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const ulang = () => {
    setTahap('verifikasi');
    setLama('');
    setBaru('');
    setKonfirmasi('');
    setTouched({});
    setCobaLama(false);
    setCobaBaru(false);
    setErrLamaServer('');
    setErrorServer('');
  };

  const verifikasi = async (e) => {
    e.preventDefault();
    if (loading) return;
    setCobaLama(true);
    setErrorServer('');
    if (validasiPasswordLama(lama).length > 0) {
      document.getElementById('password_lama')?.focus();
      return;
    }
    setLoading(true);
    try {
      await apiAuth('/auth/password/verifikasi', { method: 'POST', body: { password_lama: lama } });
      setErrLamaServer('');
      setTahap('baru');
    } catch (err) {
      // 403 = password lama salah. 429 = terlalu banyak percobaan. Keduanya bukan sesi berakhir.
      if (err.status === 403) setErrLamaServer(err.message);
      else setErrorServer(err.message);
      document.getElementById('password_lama')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const simpan = async (e) => {
    e.preventDefault();
    if (loading) return;
    setCobaBaru(true);
    setErrorServer('');
    const pertama = errBaru.length > 0 ? 'password_baru' : errKonf.length > 0 ? 'password_konfirmasi' : null;
    if (pertama) {
      document.getElementById(pertama)?.focus();
      return;
    }
    setLoading(true);
    try {
      await apiAuth('/auth/password', { method: 'PUT', body: { password_lama: lama, password_baru: baru } });
      keluar({ tipe: 'success', teks: 'Password berhasil diubah. Silakan login dengan password baru.' });
    } catch (err) {
      if (err.status === 403) {
        // password lama ternyata tidak cocok lagi (mis. sudah diganti dari perangkat lain): ulangi dari langkah 1
        ulang();
        setErrLamaServer(err.message);
        setCobaLama(true);
      } else {
        setErrorServer(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="langkah ganti-pw" aria-labelledby="judul-ganti-pw">
      <h2 id="judul-ganti-pw">Ganti password</h2>

      <ol className="ganti-pw__langkah" aria-label="Langkah ganti password">
        <li className={tahap === 'verifikasi' ? 'aktif' : 'selesai'}>
          <span aria-hidden="true">{tahap === 'verifikasi' ? '1' : '✓'}</span> Verifikasi password lama
        </li>
        <li className={tahap === 'baru' ? 'aktif' : ''}>
          <span aria-hidden="true">2</span> Buat password baru
        </li>
      </ol>

      {errorServer && <Notice tipe="error">{errorServer}</Notice>}

      {tahap === 'verifikasi' ? (
        <form className="form" onSubmit={verifikasi} noValidate>
          <p className="ganti-pw__info">
            Untuk keamanan akun, masukkan password lama Anda lebih dulu. Form password baru baru terbuka setelah password lama
            terverifikasi.
          </p>
          <Field id="password_lama" label="Password lama" errors={errLama} tampilkanError={cobaLama || Boolean(errLamaServer)} valid={false}>
            {(aria) => (
              <PasswordInput
                id="password_lama"
                nilai={lama}
                onChange={(e) => {
                  setLama(e.target.value);
                  setErrLamaServer('');
                  setErrorServer('');
                }}
                autoComplete="current-password"
                placeholder="Masukkan password lama"
                ariaProps={aria}
                disabled={loading}
              />
            )}
          </Field>
          <div className="ganti-pw__aksi">
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Memeriksa…' : 'Verifikasi password lama'}
            </button>
          </div>
        </form>
      ) : (
        <form className="form" onSubmit={simpan} noValidate>
          <div className="ganti-pw__ok" role="status">
            <span aria-hidden="true">✓</span> Password lama terverifikasi.
            <button type="button" className="link-btn" onClick={ulang} disabled={loading}>Ulangi dari awal</button>
          </div>

          <Field
            id="password_baru"
            label="Password baru"
            errors={errBaru}
            tampilkanError={tampil('password_baru')}
            valid={baru.length > 0 && errBaru.length === 0}
          >
            {(aria) => (
              <PasswordInput
                id="password_baru"
                nilai={baru}
                onChange={(e) => setBaru(e.target.value)}
                onBlur={blur}
                autoComplete="new-password"
                placeholder="Buat password baru"
                ariaProps={aria}
                disabled={loading}
              />
            )}
          </Field>

          <Field
            id="password_konfirmasi"
            label="Ulangi password baru"
            errors={errKonf}
            tampilkanError={tampil('password_konfirmasi')}
            valid={konfirmasi.length > 0 && errKonf.length === 0}
          >
            {(aria) => (
              <PasswordInput
                id="password_konfirmasi"
                nilai={konfirmasi}
                onChange={(e) => setKonfirmasi(e.target.value)}
                onBlur={blur}
                autoComplete="new-password"
                placeholder="Ulangi password baru"
                ariaProps={aria}
                disabled={loading}
              />
            )}
          </Field>

          <div className="pw-rules" aria-live="polite">
            <div className="pw-meter" aria-hidden="true">
              {[1, 2, 3, 4].map((n) => (
                <span key={n} className={`pw-meter__bar ${skor >= n ? `pw-meter__bar--${skor}` : ''}`} />
              ))}
            </div>
            <p className="pw-meter__label">
              Kekuatan password: <strong>{LABEL_KEKUATAN[skor]}</strong>
            </p>
            <ul className="pw-checklist">
              {aturan.map((a) => (
                <li key={a.label} className={a.ok ? 'ok' : ''}>
                  <span aria-hidden="true">{a.ok ? '✓' : '○'}</span> {a.label}
                </li>
              ))}
            </ul>
          </div>

          <Notice tipe="info">Setelah password diganti, Anda akan keluar dari semua perangkat dan perlu login ulang.</Notice>

          <div className="ganti-pw__aksi">
            <button type="button" className="btn btn--ghost" onClick={ulang} disabled={loading}>Batal</button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Menyimpan…' : 'Simpan password baru'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
