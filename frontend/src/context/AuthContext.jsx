import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request, ApiError } from '../lib/api.js';
import { muatSesi, simpanSesi, hapusSesi } from '../lib/session.js';
import { SESSION_DURATION_MS } from '../config.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [sesi, setSesi] = useState(() => muatSesi());
  const sesiRef = useRef(sesi);
  sesiRef.current = sesi;
  const sedangKeluar = useRef(false);

  // Keluar dari akun: cabut token di server (best effort), hapus sesi lokal,
  // lalu kembali ke halaman login dengan pesan.
  const keluar = useCallback(
    async (notice) => {
      if (sedangKeluar.current) return;
      sedangKeluar.current = true;

      const saatIni = sesiRef.current;
      hapusSesi();
      setSesi(null);
      navigate('/login', { replace: true, state: notice ? { notice } : null });

      if (saatIni?.token) {
        try {
          await request('/auth/logout', { method: 'POST', token: saatIni.token });
        } catch {
          // token mungkin sudah kedaluwarsa / dicabut; tidak masalah
        }
      }
      sedangKeluar.current = false;
    },
    [navigate]
  );

  const masuk = useCallback((token, user) => {
    const baru = { token, user, mulai: Date.now(), expiresAt: Date.now() + SESSION_DURATION_MS };
    simpanSesi(baru);
    setSesi(baru);
    return baru;
  }, []);

  // Pemanggilan API yang butuh login. Jika server menolak token (401),
  // sesi langsung diakhiri.
  const apiAuth = useCallback(
    async (path, opts = {}) => {
      const s = sesiRef.current;
      if (!s) throw new ApiError('Sesi tidak ditemukan, silakan login kembali.', 401);
      try {
        return await request(path, { ...opts, token: s.token });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          keluar({ tipe: 'warning', teks: err.message || 'Sesi Anda tidak lagi valid. Silakan login kembali.' });
        }
        throw err;
      }
    },
    [keluar]
  );

  // Pengawas batas waktu sesi. Selain interval, juga dicek saat tab kembali
  // aktif karena browser memperlambat timer di tab yang tersembunyi.
  useEffect(() => {
    if (!sesi) return undefined;

    const cek = () => {
      const s = sesiRef.current;
      if (s && Date.now() >= s.expiresAt) {
        keluar({
          tipe: 'warning',
          teks: 'Waktu sesi Anda telah habis (2 jam). Demi keamanan, silakan login kembali.',
        });
      }
    };

    cek();
    const interval = setInterval(cek, 1000);
    const saatTampil = () => document.visibilityState === 'visible' && cek();
    document.addEventListener('visibilitychange', saatTampil);
    window.addEventListener('focus', cek);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', saatTampil);
      window.removeEventListener('focus', cek);
    };
  }, [sesi, keluar]);

  const nilai = useMemo(
    () => ({
      sesi,
      user: sesi?.user ?? null,
      terautentikasi: Boolean(sesi),
      masuk,
      keluar,
      apiAuth,
    }),
    [sesi, masuk, keluar, apiAuth]
  );

  return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
