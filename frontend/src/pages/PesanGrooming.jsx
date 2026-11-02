import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { Notice } from '../components/ui.jsx';
import { HasilPesanan, JudulHalaman, KhususPelanggan, PilihPet, usePetSaya } from '../components/Pesanan.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { rupiah } from '../lib/format.js';
import { validasiPilihan } from '../lib/validators.js';

export default function PesanGrooming() {
  const { user, apiAuth } = useAuth();
  const [params] = useSearchParams();
  const petData = usePetSaya();

  const [paket, setPaket] = useState({ status: 'loading', data: [], pesan: '' });
  const [idPet, setIdPet] = useState('');
  const [idLayanan, setIdLayanan] = useState(params.get('paket') || '');
  const [sudahCoba, setSudahCoba] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorServer, setErrorServer] = useState('');
  const [hasil, setHasil] = useState(null);

  const adalahCustomer = user.role === 'CUSTOMER';

  useEffect(() => {
    if (!adalahCustomer) return undefined;
    let batal = false;
    (async () => {
      try {
        const res = await apiAuth('/paket-grooming');
        if (batal) return;
        const data = Array.isArray(res.data) ? res.data : [];
        setPaket({ status: 'ok', data, pesan: '' });
        // paket dari tautan (?paket=) yang tidak ada di daftar diabaikan
        setIdLayanan((id) => (data.some((p) => String(p.id_layanan) === String(id)) ? id : ''));
      } catch (err) {
        if (!batal) setPaket({ status: 'error', data: [], pesan: err.message });
      }
    })();
    return () => {
      batal = true;
    };
  }, [apiAuth, adalahCustomer]);

  const errors = {
    id_pet: validasiPilihan(idPet, 'Hewan'),
    id_layanan: validasiPilihan(idLayanan, 'Paket grooming'),
  };

  const petTerpilih = petData.pets.find((p) => String(p.id_pet) === String(idPet));
  const paketTerpilih = paket.data.find((p) => String(p.id_layanan) === String(idLayanan));

  const kirim = async (e) => {
    e.preventDefault();
    if (loading) return;
    setSudahCoba(true);
    setErrorServer('');

    const pertama = ['id_pet', 'id_layanan'].find((f) => errors[f].length > 0);
    if (pertama) {
      document.getElementById(pertama)?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await apiAuth('/pesanan/grooming', {
        method: 'POST',
        body: { id_pet: idPet, id_layanan: idLayanan },
      });
      setHasil(res.data);
    } catch (err) {
      setErrorServer(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ulang = () => {
    setHasil(null);
    setIdPet('');
    setIdLayanan('');
    setSudahCoba(false);
    setErrorServer('');
  };

  return (
    <AppShell lebar={1100}>
      <JudulHalaman judul="Pesan Grooming" sub="Pilih hewan dan paket grooming yang Anda inginkan." />

      {!adalahCustomer ? (
        <KhususPelanggan />
      ) : hasil ? (
        <HasilPesanan
          pesanan={hasil}
          total={Math.round(Number(hasil.harga_paket))}
          onPesanLagi={ulang}
          rincian={[
            ['Layanan', 'Grooming'],
            ['Paket', hasil.nama_layanan],
          ]}
        />
      ) : (
        <form className="pesan-layout" onSubmit={kirim} noValidate>
          <div className="pesan-layout__utama">
            {errorServer && <Notice tipe="error">{errorServer}</Notice>}

            <section className="langkah">
              <h2><span>1</span> Pilih hewan</h2>
              <PilihPet
                data={petData}
                nilai={idPet}
                onChange={setIdPet}
                errors={errors.id_pet}
                tampilkanError={sudahCoba}
                disabled={loading}
              />
            </section>

            <section className="langkah">
              <h2><span>2</span> Pilih paket grooming</h2>
              {paket.status === 'loading' && (
                <div className="pilih-grid pilih-grid--1" aria-busy="true">
                  {[1, 2, 3].map((n) => <div key={n} className="pilihan pilihan--skeleton" />)}
                </div>
              )}
              {paket.status === 'error' && <Notice tipe="error">Gagal memuat paket grooming: {paket.pesan}</Notice>}
              {paket.status === 'ok' && paket.data.length === 0 && (
                <p className="kosong">Belum ada paket grooming yang tersedia.</p>
              )}
              {paket.status === 'ok' && paket.data.length > 0 && (
                <div className={`field ${sudahCoba && errors.id_layanan.length ? 'field--error' : ''}`}>
                  <div className="pilih-grid pilih-grid--1" role="radiogroup" aria-label="Pilih paket grooming">
                    {paket.data.map((p, i) => (
                      <label
                        key={p.id_layanan}
                        className={`pilihan pilihan--paket ${String(idLayanan) === String(p.id_layanan) ? 'pilihan--on' : ''}`}
                      >
                        <input
                          type="radio"
                          id={i === 0 ? 'id_layanan' : undefined}
                          name="id_layanan"
                          value={p.id_layanan}
                          checked={String(idLayanan) === String(p.id_layanan)}
                          onChange={(e) => setIdLayanan(e.target.value)}
                          disabled={loading}
                        />
                        <span className="pilihan__isi">
                          <span className="paket__jenis">{p.jenis_paket}</span>
                          <strong>{p.nama_layanan}</strong>
                          <small>{p.detail_layanan || 'Tidak ada detail layanan.'}</small>
                        </span>
                        <span className="pilihan__harga">{rupiah(p.harga_paket)}</span>
                      </label>
                    ))}
                  </div>
                  <div className="field__messages" aria-live="polite">
                    {sudahCoba && errors.id_layanan.length > 0 && (
                      <ul className="field__errors">{errors.id_layanan.map((x) => <li key={x}>{x}</li>)}</ul>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="ringkasan">
            <h2>Ringkasan pesanan</h2>
            <dl>
              <div><dt>Layanan</dt><dd>Grooming</dd></div>
              <div><dt>Hewan</dt><dd>{petTerpilih?.nama_pet || <em>Belum dipilih</em>}</dd></div>
              <div><dt>Paket</dt><dd>{paketTerpilih?.nama_layanan || <em>Belum dipilih</em>}</dd></div>
            </dl>
            <div className="ringkasan__total">
              <span>Total</span>
              <strong>{paketTerpilih ? rupiah(paketTerpilih.harga_paket) : '—'}</strong>
            </div>
            <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
              {loading ? 'Membuat pesanan…' : 'Buat pesanan'}
            </button>
            <p className="ringkasan__catatan">Pesanan dapat dibatalkan selama masih berstatus menunggu.</p>
          </aside>
        </form>
      )}
    </AppShell>
  );
}
