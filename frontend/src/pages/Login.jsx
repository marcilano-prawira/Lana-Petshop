import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout, Field, Notice, PasswordInput } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { request } from '../lib/api.js';
import { validasiUsername, validasiPasswordLogin } from '../lib/validators.js';
import { catatGagal, resetGuard, sisaKunciMs, sisaPercobaan } from '../lib/loginGuard.js';
import { formatDetik } from '../lib/format.js';
import { MAX_LOGIN_ATTEMPTS } from '../config.js';

export default function Login() {
  const { masuk } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Pesan dari halaman lain (mis. sesi habis, registrasi berhasil)
  const [notice, setNotice] = useState(location.state?.notice ?? null);
  const [form, setForm] = useState({ username: location.state?.username ?? '', password: '' });
  const [touched, setTouched] = useState({});
  const [sudahCoba, setSudahCoba] = useState(false);
  const [errorServer, setErrorServer] = useState('');
  const [loading, setLoading] = useState(false);
  const [sisaKunci, setSisaKunci] = useState(() => sisaKunciMs());

  // Bersihkan state navigasi agar pesan tidak muncul lagi setelah refresh
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hitung mundur saat login dikunci
  useEffect(() => {
    if (sisaKunci <= 0) return undefined;
    const t = setInterval(() => setSisaKunci(sisaKunciMs()), 250);
    return () => clearInterval(t);
  }, [sisaKunci > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const errors = {
    username: validasiUsername(form.username),
    password: validasiPasswordLogin(form.password),
  };
  const tampil = (f) => sudahCoba || Boolean(touched[f]);
  const terkunci = sisaKunci > 0;

  const ubah = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrorServer('');
  };
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const kirim = async (e) => {
    e.preventDefault();
    if (loading || sisaKunciMs() > 0) return;

    setSudahCoba(true);
    setErrorServer('');
    setNotice(null);

    const pertama = ['username', 'password'].find((f) => errors[f].length > 0);
    if (pertama) {
      document.getElementById(pertama)?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await request('/auth/login', {
        method: 'POST',
        body: { username: form.username, password: form.password },
      });
      resetGuard();
      masuk(res.data.token, res.data.user);
      navigate('/home', { replace: true });
    } catch (err) {
      if (err.status === 401) {
        const { terkunci: kena } = catatGagal();
        setForm((f) => ({ ...f, password: '' }));
        if (kena) {
          setSisaKunci(sisaKunciMs());
          setErrorServer(
            `${err.message}. Terlalu banyak percobaan gagal, login dikunci sementara.`
          );
        } else {
          const sisa = sisaPercobaan();
          setErrorServer(
            sisa <= 3
              ? `${err.message}. Sisa percobaan: ${sisa} dari ${MAX_LOGIN_ATTEMPTS}.`
              : err.message
          );
        }
        setTouched({});
        setSudahCoba(false);
        document.getElementById('password')?.focus();
      } else {
        setErrorServer(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      judul="Selamat datang kembali"
      subjudul="Masuk ke akun Lana Petshop Anda."
      footer={
        <>
          Belum punya akun? <Link to="/registrasi">Daftar sekarang</Link>
        </>
      }
    >
      {notice && (
        <Notice tipe={notice.tipe} onClose={() => setNotice(null)}>
          {notice.teks}
        </Notice>
      )}
      {errorServer && !terkunci && <Notice tipe="error">{errorServer}</Notice>}
      {terkunci && (
        <Notice tipe="warning" judul="Login dikunci sementara">
          Terlalu banyak percobaan gagal. Coba lagi dalam <strong>{formatDetik(sisaKunci)} detik</strong>.
        </Notice>
      )}

      <form onSubmit={kirim} noValidate className="form">
        <Field
          id="username"
          label="Username"
          errors={errors.username}
          tampilkanError={tampil('username')}
          valid={errors.username.length === 0}
          hint="Huruf kecil, angka, titik atau underscore. 4–50 karakter."
        >
          {(aria) => (
            <input
              id="username"
              name="username"
              type="text"
              className="input"
              value={form.username}
              onChange={ubah}
              onBlur={blur}
              autoComplete="username"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="contoh: lana_pet"
              disabled={loading || terkunci}
              autoFocus
              {...aria}
            />
          )}
        </Field>

        <Field
          id="password"
          label="Password"
          errors={errors.password}
          tampilkanError={tampil('password')}
          valid={errors.password.length === 0}
        >
          {(aria) => (
            <PasswordInput
              id="password"
              nilai={form.password}
              onChange={ubah}
              onBlur={blur}
              autoComplete="current-password"
              placeholder="Masukkan password"
              ariaProps={aria}
              disabled={loading || terkunci}
            />
          )}
        </Field>

        <button type="submit" className="btn btn--primary btn--block" disabled={loading || terkunci}>
          {loading ? 'Memeriksa…' : terkunci ? `Coba lagi dalam ${formatDetik(sisaKunci)} dtk` : 'Masuk'}
        </button>
      </form>
    </AuthLayout>
  );
}
