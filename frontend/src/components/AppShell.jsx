import { Link } from 'react-router-dom';
import { Brand } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useSisaWaktu from '../lib/useSisaWaktu.js';
import { NAMA_ROLE, formatSisa } from '../lib/format.js';
import { SESSION_WARNING_MS } from '../config.js';

// Kerangka halaman setelah login: topbar, timer sesi, banner peringatan.
export default function AppShell({ children, lebar = 1200 }) {
  const { user, sesi, keluar } = useAuth();
  const sisa = useSisaWaktu(sesi.expiresAt);
  const hampirHabis = sisa <= SESSION_WARNING_MS;

  return (
    <div className="home">
      <header className="topbar">
        <Link to="/home" className="brand-link" aria-label="Ke beranda">
          <Brand />
        </Link>
        <div className="topbar__right">
          <div className={`timer ${hampirHabis ? 'timer--warn' : ''}`} title="Sisa waktu sesi">
            <span className="timer__label">Sisa sesi</span>
            <span className="timer__value" role="timer">{formatSisa(sisa)}</span>
          </div>
          <div className="usercard">
            <span className="usercard__avatar">{(user.nama || user.username).charAt(0).toUpperCase()}</span>
            <div>
              <strong>{user.nama || user.username}</strong>
              <small>{NAMA_ROLE[user.role] || user.role}</small>
            </div>
          </div>
          <button className="btn btn--ghost" onClick={() => keluar({ tipe: 'success', teks: 'Anda telah keluar dari akun.' })}>
            Keluar
          </button>
        </div>
      </header>

      {hampirHabis && (
        <div className="banner-sesi" role="alert">
          Sesi Anda akan berakhir dalam <strong>{formatSisa(sisa)}</strong>. Selesaikan aktivitas Anda; setelah itu Anda
          akan diarahkan kembali ke halaman login.
        </div>
      )}

      <main className="home__main" style={{ maxWidth: lebar }}>{children}</main>
    </div>
  );
}
