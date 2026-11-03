import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import FotoBukti from '../components/FotoBukti.jsx';
import { Chip, Notice } from '../components/ui.jsx';
import { JudulHalaman, KhususPelanggan } from '../components/Pesanan.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { INFO_PEMBAYARAN, METODE_BAYAR } from '../config.js';
import { formatUkuran, kompresFoto, periksaFileBukti } from '../lib/gambar.js';
import { formatTanggalJam, rupiah } from '../lib/format.js';
import { formatTanggalWaktu } from '../lib/hotel.js';
import { LABEL_PEMBAYARAN, ringkasLayanan, statusGabungan, totalPesanan } from '../lib/status.js';
import { validasiMetodeBayar } from '../lib/validators.js';

const FOTO_KOSONG = { status: 'kosong', alasan: [] };

function RingkasanPesanan({ p }) {
  return (
    <section className="langkah">
      <h2>Pesanan #{p.id_pesanan}</h2>
      <dl className="pesanan__rincian">
        <div><dt>Layanan</dt><dd>{ringkasLayanan(p)}</dd></div>
        <div><dt>Hewan</dt><dd>{p.nama_pet}</dd></div>
        {p.jenis_pesanan === 'HOTEL' && (
          <>
            <div><dt>Check-in</dt><dd>{formatTanggalWaktu(p.jam_checkin)}</dd></div>
            <div><dt>Check-out</dt><dd>{formatTanggalWaktu(p.jam_checkout)}</dd></div>
          </>
        )}
        <div className="pesanan__total"><dt>Total yang harus dibayar</dt><dd>{rupiah(totalPesanan(p))}</dd></div>
      </dl>
    </section>
  );
}

export default function Bayar() {
  const { idPesanan } = useParams();
  const { user, apiAuth } = useAuth();
  const adalahCustomer = user.role === 'CUSTOMER';
  const idValid = /^[1-9][0-9]*$/.test(idPesanan ?? '');

  const [data, setData] = useState({ status: 'loading', pesanan: null, pembayaran: null, pesan: '' });
  const [metode, setMetode] = useState('');
  const [foto, setFoto] = useState(FOTO_KOSONG);
  const [seret, setSeret] = useState(false);
  const [sudahCoba, setSudahCoba] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorServer, setErrorServer] = useState('');
  const [terkirim, setTerkirim] = useState(false);
  const tokenFoto = useRef(0);

  const muat = useCallback(async () => {
    if (!idValid) {
      setData({ status: 'error', pesanan: null, pembayaran: null, pesan: 'Nomor pesanan tidak valid.' });
      return;
    }
    setData((d) => ({ ...d, status: 'loading' }));
    try {
      const [rp, rb] = await Promise.all([apiAuth(`/pesanan/${idPesanan}`), apiAuth('/pembayaran')]);
      const bayar = (Array.isArray(rb.data) ? rb.data : []).find((b) => String(b.id_pesanan) === String(idPesanan)) ?? null;
      setData({ status: 'ok', pesanan: rp.data, pembayaran: bayar, pesan: '' });
    } catch (err) {
      setData({ status: 'error', pesanan: null, pembayaran: null, pesan: err.message });
    }
  }, [apiAuth, idPesanan, idValid]);

  useEffect(() => {
    if (adalahCustomer) muat();
  }, [adalahCustomer, muat]);

  const errMetode = validasiMetodeBayar(metode, METODE_BAYAR);
  const errFoto = foto.status === 'siap' ? [] : foto.status === 'error' ? foto.alasan : ['Foto bukti pembayaran wajib diunggah.'];

  const prosesFile = async (daftar) => {
    const file = daftar?.[0];
    if (!file) return;
    const giliran = ++tokenFoto.current;
    setErrorServer('');

    if (daftar.length > 1) {
      setFoto({ status: 'error', alasan: ['Hanya satu foto yang dapat diunggah. Pilih foto bukti yang paling jelas.'] });
      return;
    }

    setFoto({ status: 'memproses', alasan: [], nama: file.name });
    const alasan = await periksaFileBukti(file);
    if (giliran !== tokenFoto.current) return;
    if (alasan.length) {
      setFoto({ status: 'error', alasan });
      return;
    }
    try {
      const hasil = await kompresFoto(file);
      if (giliran !== tokenFoto.current) return;
      setFoto({ status: 'siap', alasan: [], nama: file.name, asli: file.size, ...hasil });
    } catch (err) {
      if (giliran === tokenFoto.current) setFoto({ status: 'error', alasan: [err.message] });
    }
  };

  const hapusFoto = () => {
    tokenFoto.current += 1;
    setFoto(FOTO_KOSONG);
  };

  const kirim = async (e) => {
    e.preventDefault();
    if (loading || foto.status === 'memproses') return;
    setSudahCoba(true);
    setErrorServer('');

    if (errMetode.length) {
      document.getElementById('metode')?.focus();
      return;
    }
    if (errFoto.length) {
      document.getElementById('bukti')?.focus();
      return;
    }

    setLoading(true);
    try {
      await apiAuth('/pembayaran', {
        method: 'POST',
        body: {
          id_pesanan: Number(idPesanan),
          metode_pembayaran: metode,
          bukti_pembayaran: foto.dataUrl,
        },
      });
      setTerkirim(true);
      setFoto(FOTO_KOSONG);
      setMetode('');
      setSudahCoba(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await muat();
    } catch (err) {
      const kebesaran = err.status === 413 || /too large|terlalu besar/i.test(err.message);
      setErrorServer(
        kebesaran
          ? 'Server menolak foto karena melebihi batas ukuran request. Foto sudah dikompres, jadi batas di backend perlu dinaikkan (lihat KONTRAK-API.md).'
          : err.message
      );
      if (err.status === 409) muat(); // status berubah (mis. sudah ada pembayaran / pesanan dibatalkan)
    } finally {
      setLoading(false);
    }
  };

  const { pesanan, pembayaran } = data;
  const st = pesanan ? statusGabungan(pesanan, pembayaran) : null;
  const bisaMengisi = st && st.bisaBayar;

  return (
    <AppShell lebar={900}>
      <JudulHalaman judul="Pembayaran" sub="Unggah foto bukti pembayaran. Admin akan memeriksanya sebelum pembayaran dinyatakan berhasil." />

      {!adalahCustomer ? (
        <KhususPelanggan />
      ) : data.status === 'loading' ? (
        <div className="langkah pesanan--skeleton" style={{ minHeight: 200 }} aria-busy="true" />
      ) : data.status === 'error' ? (
        <Notice tipe="error">
          Gagal memuat pesanan: {data.pesan}{' '}
          {idValid && <button type="button" className="link-btn" onClick={muat}>Coba lagi</button>}
        </Notice>
      ) : (
        <div className="bayar">
          {terkirim && (
            <Notice tipe="success" judul="Bukti pembayaran terkirim" onClose={() => setTerkirim(false)}>
              Admin akan memeriksa bukti Anda. Status akan berubah setelah diverifikasi.
            </Notice>
          )}

          <RingkasanPesanan p={pesanan} />

          {st.kode === 'dibatalkan' && (
            <Notice tipe="warning">Pesanan ini sudah dibatalkan, sehingga tidak dapat dibayar.</Notice>
          )}

          {pembayaran && !bisaMengisi && (
            <section className="langkah">
              <header className="langkah__kepala">
                <h2>Bukti pembayaran</h2>
                <Chip tone={LABEL_PEMBAYARAN[pembayaran.status_pembayaran]?.tone}>
                  {LABEL_PEMBAYARAN[pembayaran.status_pembayaran]?.label ?? pembayaran.status_pembayaran}
                </Chip>
              </header>
              <div className="bukti-tampil">
                <FotoBukti src={pembayaran.bukti_pembayaran} />
                <dl className="pesanan__rincian">
                  <div><dt>Metode</dt><dd>{pembayaran.metode_pembayaran}</dd></div>
                  <div><dt>Dikirim</dt><dd>{formatTanggalJam(pembayaran.tanggal_bayar)}</dd></div>
                  {pembayaran.tanggal_verifikasi && (
                    <div><dt>Diverifikasi</dt><dd>{formatTanggalJam(pembayaran.tanggal_verifikasi)}</dd></div>
                  )}
                </dl>
              </div>
              {st.kode === 'verifikasi' && (
                <Notice tipe="info">
                  Menunggu admin memeriksa bukti Anda. Anda tidak perlu mengirim ulang.{' '}
                  <button type="button" className="link-btn" onClick={muat}>Cek status terbaru</button>
                </Notice>
              )}
              {(st.kode === 'diproses' || st.kode === 'selesai') && (
                <Notice tipe="success">Pembayaran Anda sudah terverifikasi. Pesanan sedang diproses.</Notice>
              )}
              <div className="hasil__aksi">
                <Link to="/pesanan" className="btn btn--primary">Ke Pesanan Saya</Link>
              </div>
            </section>
          )}

          {bisaMengisi && (
            <form onSubmit={kirim} noValidate className="bayar__form">
              {st.kode === 'ditolak' && (
                <Notice tipe="error" judul="Pembayaran sebelumnya ditolak admin">
                  Bukti yang Anda kirim tidak dapat diverifikasi. Kirim ulang foto yang jelas, utuh, dan menunjukkan nominal
                  serta waktu transaksi.
                </Notice>
              )}
              {errorServer && <Notice tipe="error">{errorServer}</Notice>}

              {INFO_PEMBAYARAN.length > 0 && (
                <section className="langkah">
                  <h2>Instruksi pembayaran</h2>
                  <ul className="instruksi">
                    {INFO_PEMBAYARAN.map((i) => (
                      <li key={i.metode}><strong>{i.metode}</strong><span>{i.keterangan}</span></li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="langkah">
                <h2><span>1</span> Metode pembayaran</h2>
                <div className={`field ${sudahCoba && errMetode.length ? 'field--error' : ''}`}>
                  <div className="pilih-grid pilih-grid--3" role="radiogroup" aria-label="Metode pembayaran">
                    {METODE_BAYAR.map((m, i) => (
                      <label key={m} className={`pilihan ${metode === m ? 'pilihan--on' : ''}`}>
                        <input type="radio" id={i === 0 ? 'metode' : undefined} name="metode" value={m} checked={metode === m}
                          onChange={() => { setMetode(m); setErrorServer(''); }} disabled={loading} />
                        <strong>{m}</strong>
                      </label>
                    ))}
                  </div>
                  <div className="field__messages" aria-live="polite">
                    {sudahCoba && errMetode.length > 0 && (
                      <ul className="field__errors">{errMetode.map((x) => <li key={x}>{x}</li>)}</ul>
                    )}
                  </div>
                </div>
              </section>

              <section className="langkah">
                <h2><span>2</span> Unggah foto bukti</h2>
                <div className={`field ${(sudahCoba || foto.status === 'error') && errFoto.length ? 'field--error' : ''}`}>
                  {foto.status !== 'siap' ? (
                    <label
                      htmlFor="bukti"
                      className={`dropzone ${seret ? 'dropzone--seret' : ''}`}
                      onDragOver={(e) => { e.preventDefault(); setSeret(true); }}
                      onDragLeave={() => setSeret(false)}
                      onDrop={(e) => { e.preventDefault(); setSeret(false); prosesFile([...e.dataTransfer.files]); }}
                    >
                      <input id="bukti" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                        disabled={loading || foto.status === 'memproses'}
                        onChange={(e) => { prosesFile([...e.target.files]); e.target.value = ''; }} />
                      <span className="dropzone__ikon" aria-hidden="true">{foto.status === 'memproses' ? '⏳' : '📷'}</span>
                      <strong>{foto.status === 'memproses' ? 'Memproses foto…' : 'Klik untuk memilih foto, atau seret ke sini'}</strong>
                      <small>JPG, PNG, atau WEBP · maksimal 10 MB · pastikan nominal dan waktu transaksi terbaca</small>
                    </label>
                  ) : (
                    <div className="preview">
                      <FotoBukti src={foto.dataUrl} alt="Pratinjau bukti pembayaran" />
                      <div className="preview__info">
                        <strong>{foto.nama}</strong>
                        <small>{foto.lebar}×{foto.tinggi} px · {formatUkuran(foto.byte)} setelah dikompres (asli {formatUkuran(foto.asli)})</small>
                        <div className="preview__aksi">
                          <label htmlFor="bukti-ganti" className="btn btn--ghost">
                            Ganti foto
                            <input id="bukti-ganti" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                              disabled={loading} onChange={(e) => { prosesFile([...e.target.files]); e.target.value = ''; }} />
                          </label>
                          <button type="button" className="btn btn--ghost" onClick={hapusFoto} disabled={loading}>Hapus</button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="field__messages" aria-live="polite">
                    {(sudahCoba || foto.status === 'error') && errFoto.length > 0 && foto.status !== 'memproses' && (
                      <ul className="field__errors">{errFoto.map((x) => <li key={x}>{x}</li>)}</ul>
                    )}
                  </div>
                </div>
              </section>

              <div className="bayar__kirim">
                <div>
                  <small>Total yang dibayar</small>
                  <strong>{rupiah(totalPesanan(pesanan))}</strong>
                </div>
                <button type="submit" className="btn btn--primary" disabled={loading || foto.status === 'memproses'}>
                  {loading ? 'Mengirim bukti…' : st.kode === 'ditolak' ? 'Kirim ulang bukti' : 'Kirim bukti pembayaran'}
                </button>
              </div>
            </form>
          )}

          {pembayaran && st.kode === 'ditolak' && (
            <section className="langkah">
              <h2>Bukti sebelumnya (ditolak)</h2>
              <FotoBukti src={pembayaran.bukti_pembayaran} alt="Bukti pembayaran yang ditolak" kecil />
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}
