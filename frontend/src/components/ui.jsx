import { useEffect, useRef, useState } from 'react';

/* ------------------------------- Logo -------------------------------- */

export function PawIcon({ size = 24, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" fill="currentColor">
      <ellipse cx="32" cy="41" rx="11" ry="9" />
      <ellipse cx="18" cy="29" rx="5" ry="6.5" transform="rotate(-18 18 29)" />
      <ellipse cx="28" cy="20" rx="5" ry="7" />
      <ellipse cx="38" cy="20" rx="5" ry="7" />
      <ellipse cx="47" cy="29" rx="5" ry="6.5" transform="rotate(18 47 29)" />
    </svg>
  );
}

export function Brand({ inverted = false }) {
  return (
    <div className={`brand ${inverted ? 'brand--inverted' : ''}`}>
      <span className="brand__mark">
        <PawIcon size={22} />
      </span>
      <span className="brand__name">Lana Petshop</span>
    </div>
  );
}

/* ------------------------------ Notice ------------------------------- */

const IKON_NOTICE = {
  error: 'M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
  warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  success: 'M12 2a10 10 0 100 20 10 10 0 000-20zm-2 15l-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z',
  info: 'M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
};

export function Notice({ tipe = 'info', judul, children, onClose }) {
  return (
    <div className={`notice notice--${tipe}`} role={tipe === 'error' ? 'alert' : 'status'}>
      <svg className="notice__icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d={IKON_NOTICE[tipe]} />
      </svg>
      <div className="notice__body">
        {judul && <strong className="notice__title">{judul}</strong>}
        <div>{children}</div>
      </div>
      {onClose && (
        <button type="button" className="notice__close" onClick={onClose} aria-label="Tutup pesan">
          ×
        </button>
      )}
    </div>
  );
}


// errors: array alasan. Ditampilkan hanya jika `tampilkanError` true.
export function Field({
  id,
  label,
  errors = [],
  tampilkanError = false,
  hint,
  valid = false,
  children,
  aksiKanan,
}) {
  const adaError = tampilkanError && errors.length > 0;
  return (
    <div className={`field ${adaError ? 'field--error' : ''} ${tampilkanError && valid ? 'field--valid' : ''}`}>
      <div className="field__top">
        <label htmlFor={id} className="field__label">
          {label}
        </label>
        {aksiKanan}
      </div>
      {children({ 'aria-invalid': adaError || undefined, 'aria-describedby': `${id}-pesan` })}
      <div id={`${id}-pesan`} className="field__messages" aria-live="polite">
        {adaError ? (
          <ul className="field__errors">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : (
          hint && <p className="field__hint">{hint}</p>
        )}
      </div>
    </div>
  );
}

export function PasswordInput({ id, nilai, onChange, onBlur, autoComplete, placeholder, ariaProps, disabled }) {
  const [lihat, setLihat] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const cekCaps = (e) => {
    if (typeof e.getModifierState === 'function') setCapsLock(e.getModifierState('CapsLock'));
  };

  return (
    <>
      <div className="input-wrap">
        <input
          id={id}
          name={id}
          type={lihat ? 'text' : 'password'}
          value={nilai}
          onChange={onChange}
          onBlur={(e) => {
            setCapsLock(false);
            onBlur?.(e);
          }}
          onKeyUp={cekCaps}
          onKeyDown={cekCaps}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="off"
          className="input input--with-action"
          {...ariaProps}
        />
        <button
          type="button"
          className="input-wrap__action"
          onClick={() => setLihat((v) => !v)}
          aria-label={lihat ? 'Sembunyikan password' : 'Tampilkan password'}
          aria-pressed={lihat}
          tabIndex={0}
        >
          {lihat ? 'Sembunyikan' : 'Lihat'}
        </button>
      </div>
      {capsLock && <p className="caps-warning">⚠ Caps Lock sedang aktif</p>}
    </>
  );
}

/* ---------------------------- Auth layout ---------------------------- */

export function AuthLayout({ judul, subjudul, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth__panel">
        <div className="auth__panel-inner">
          <Brand inverted />
          <div className="auth__hero">
            <h1>
              Care, Love &amp;
              <br />
              Happiness for
              <br />
              Every Pet
            </h1>
            <p>Grooming dan penitipan hewan kesayangan, dipantau langsung dari satu tempat.</p>
          </div>
          <ul className="auth__points">
            <li>
              <span>✂</span> Paket grooming sesuai kebutuhan
            </li>
            <li>
              <span>🏠</span> Pet hotel yang nyaman
            </li>
            <li>
              <span>📋</span> Pantau progres layanan
            </li>
          </ul>
        </div>
        <PawIcon size={360} className="auth__paw auth__paw--1" />
        <PawIcon size={200} className="auth__paw auth__paw--2" />
      </aside>

      <main className="auth__main">
        <div className="auth__card">
          <header className="auth__header">
            <h2>{judul}</h2>
            <p>{subjudul}</p>
          </header>
          {children}
          {footer && <footer className="auth__footer">{footer}</footer>}
        </div>
      </main>
    </div>
  );
}

/* -------------------------------- Chip -------------------------------- */

export function Chip({ tone = 'muted', children }) {
  return <span className={`chip chip--${tone}`}>{children}</span>;
}

/* -------------------------------- Modal ------------------------------- */

// Dialog: ESC menutup, fokus dikunci di dalam dialog, scroll halaman dikunci.
export function Modal({ judul, onTutup, children, lebar = 760, kunci = false }) {
  const kotak = useRef(null);
  const fokusSebelum = useRef(null);

  useEffect(() => {
    fokusSebelum.current = document.activeElement;
    const overflowLama = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    kotak.current?.focus();

    const tombol = (e) => {
      if (e.key === 'Escape' && !kunci) {
        onTutup();
        return;
      }
      if (e.key !== 'Tab') return;
      const bisaFokus = kotak.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!bisaFokus || bisaFokus.length === 0) return;
      const pertama = bisaFokus[0];
      const terakhir = bisaFokus[bisaFokus.length - 1];
      if (e.shiftKey && (document.activeElement === pertama || document.activeElement === kotak.current)) {
        e.preventDefault();
        terakhir.focus();
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault();
        pertama.focus();
      }
    };
    document.addEventListener('keydown', tombol);
    return () => {
      document.removeEventListener('keydown', tombol);
      document.body.style.overflow = overflowLama;
      fokusSebelum.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal-latar" onMouseDown={(e) => e.target === e.currentTarget && !kunci && onTutup()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={judul} tabIndex={-1} ref={kotak} style={{ maxWidth: lebar }}>
        <header className="modal__kepala">
          <h2>{judul}</h2>
          <button type="button" className="modal__tutup" onClick={onTutup} disabled={kunci} aria-label="Tutup">×</button>
        </header>
        <div className="modal__isi">{children}</div>
      </div>
    </div>
  );
}

/* ---------------------------- Foto bukti ------------------------------ */

// Bukti bisa berupa data URL (sekarang), URL/path file (nanti jika disimpan sebagai file),
// atau teks biasa (data lama). Mengembalikan src gambar atau null.
export function sumberGambar(bukti) {
  if (typeof bukti !== 'string' || bukti === '') return null;
  if (/^data:image\/(jpeg|png|webp);base64,/i.test(bukti)) return bukti;
  if (/^https?:\/\//i.test(bukti) || bukti.startsWith('/')) return bukti;
  return null;
}
