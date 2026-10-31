import { useState } from 'react';
import { Modal, sumberGambar } from './ui.jsx';

// Menampilkan foto bukti pembayaran. Klik untuk memperbesar.
export default function FotoBukti({ src, alt = 'Bukti pembayaran', kecil = false }) {
  const [besar, setBesar] = useState(false);
  const gambar = sumberGambar(src);

  if (!gambar) {
    return (
      <div className="foto-bukti foto-bukti--kosong">
        {src ? (
          <>
            <strong>Bukti tersimpan bukan sebagai foto</strong>
            <span className="foto-bukti__teks">{String(src).slice(0, 120)}</span>
          </>
        ) : (
          <strong>Tidak ada foto bukti</strong>
        )}
      </div>
    );
  }

  return (
    <>
      <button type="button" className={`foto-bukti ${kecil ? 'foto-bukti--kecil' : ''}`} onClick={() => setBesar(true)}
        aria-label={`${alt}, klik untuk memperbesar`}>
        <img src={gambar} alt={alt} />
        <span className="foto-bukti__zoom" aria-hidden="true">🔍 Perbesar</span>
      </button>
      {besar && (
        <Modal judul={alt} onTutup={() => setBesar(false)} lebar={1000}>
          <div className="foto-besar">
            <img src={gambar} alt={alt} />
          </div>
        </Modal>
      )}
    </>
  );
}
