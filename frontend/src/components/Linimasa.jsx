import { Notice } from './ui.jsx';
import { formatTanggalJam } from '../lib/format.js';

// Riwayat progres layanan. state: { status: 'loading' | 'ok' | 'error', riwayat: [], pesan? }
export default function Linimasa({ state }) {
  if (!state || state.status === 'loading') return <p className="linimasa__info" aria-busy="true">Memuat progres…</p>;
  if (state.status === 'error') return <Notice tipe="error">Gagal memuat progres: {state.pesan}</Notice>;
  if (state.riwayat.length === 0) return <p className="linimasa__info">Belum ada catatan progres.</p>;
  return (
    <ol className="linimasa">
      {state.riwayat.map((r, i) => (
        <li key={r.id_progress ?? i} className={i === 0 ? 'linimasa__terkini' : ''}>
          <strong>{r.status_progress}</strong>
          {r.keterangan && <span>{r.keterangan}</span>}
          <time>{formatTanggalJam(r.updated_at)}</time>
        </li>
      ))}
    </ol>
  );
}
