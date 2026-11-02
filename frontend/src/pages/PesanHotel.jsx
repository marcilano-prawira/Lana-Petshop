import { useState } from 'react';
import AppShell from '../components/AppShell.jsx';
import { Field, Notice } from '../components/ui.jsx';
import { HasilPesanan, JudulHalaman, KhususPelanggan, PilihPet, usePetSaya } from '../components/Pesanan.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { HOTEL_TARIF_PER_HARI } from '../config.js';
import { rupiah } from '../lib/format.js';
import { formatTanggalWaktu, hitungDurasiHari, hitungTotalHotel, keInputLokal } from '../lib/hotel.js';
import { BATAS_HOTEL, validasiCheckin, validasiCheckout, validasiPilihan } from '../lib/validators.js';

export default function PesanHotel() {
  const { user, apiAuth } = useAuth();
  const petData = usePetSaya();

  const [form, setForm] = useState({ id_pet: '', checkin: '', checkout: '' });
  const [touched, setTouched] = useState({});
  const [sudahCoba, setSudahCoba] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorServer, setErrorServer] = useState('');
  const [hasil, setHasil] = useState(null);

  const adalahCustomer = user.role === 'CUSTOMER';
  const sekarang = new Date();

  const errors = {
    id_pet: validasiPilihan(form.id_pet, 'Hewan'),
    checkin: validasiCheckin(form.checkin, sekarang),
    checkout: validasiCheckout(form.checkin, form.checkout),
  };
  const tampil = (f) => sudahCoba || Boolean(touched[f]);

  const ubah = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrorServer('');
  };
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const petTerpilih = petData.pets.find((p) => String(p.id_pet) === String(form.id_pet));
  const jadwalValid = errors.checkin.length === 0 && errors.checkout.length === 0 && form.checkin && form.checkout;
  const durasi = jadwalValid ? hitungDurasiHari(form.checkin, form.checkout) : null;
  const perkiraan = jadwalValid ? hitungTotalHotel(form.checkin, form.checkout, HOTEL_TARIF_PER_HARI) : null;

  const kirim = async (e) => {
    e.preventDefault();
    if (loading) return;
    setSudahCoba(true);
    setErrorServer('');

    const pertama = ['id_pet', 'checkin', 'checkout'].find((f) => errors[f].length > 0);
    if (pertama) {
      document.getElementById(pertama)?.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await apiAuth('/pesanan/hotel', {
        method: 'POST',
        body: {
          id_pet: form.id_pet,
          jam_checkin: new Date(form.checkin).toISOString(),
          jam_checkout: new Date(form.checkout).toISOString(),
        },
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
    setForm({ id_pet: '', checkin: '', checkout: '' });
    setTouched({});
    setSudahCoba(false);
    setErrorServer('');
  };

  const minCheckin = keInputLokal(sekarang);

  return (
    <AppShell lebar={1100}>
      <JudulHalaman judul="Pesan Pet Hotel" sub="Titipkan hewan kesayangan Anda dengan nyaman." />

      {!adalahCustomer ? (
        <KhususPelanggan />
      ) : hasil ? (
        <HasilPesanan
          pesanan={hasil}
          total={hitungTotalHotel(hasil.jam_checkin, hasil.jam_checkout, hasil.tarif_per_hari)}
          onPesanLagi={ulang}
          rincian={[
            ['Layanan', 'Pet Hotel'],
            ['Check-in', formatTanggalWaktu(hasil.jam_checkin)],
            ['Check-out', formatTanggalWaktu(hasil.jam_checkout)],
            ['Durasi', `${hitungDurasiHari(hasil.jam_checkin, hasil.jam_checkout)} hari`],
            ['Tarif per hari', rupiah(hasil.tarif_per_hari)],
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
                nilai={form.id_pet}
                onChange={(v) => {
                  setForm((f) => ({ ...f, id_pet: v }));
                  setErrorServer('');
                }}
                errors={errors.id_pet}
                tampilkanError={sudahCoba}
                disabled={loading}
              />
            </section>

            <section className="langkah">
              <h2><span>2</span> Tentukan jadwal menginap</h2>
              <div className="form form--grid">
                <Field
                  id="checkin"
                  label="Check-in"
                  errors={errors.checkin}
                  tampilkanError={tampil('checkin')}
                  valid={errors.checkin.length === 0}
                  hint={`Paling jauh ${BATAS_HOTEL.MAKS_HARI_KE_DEPAN} hari dari sekarang.`}
                >
                  {(aria) => (
                    <input
                      id="checkin"
                      name="checkin"
                      type="datetime-local"
                      className="input"
                      value={form.checkin}
                      min={minCheckin}
                      onChange={ubah}
                      onBlur={blur}
                      disabled={loading}
                      {...aria}
                    />
                  )}
                </Field>

                <Field
                  id="checkout"
                  label="Check-out"
                  errors={errors.checkout}
                  tampilkanError={tampil('checkout')}
                  valid={errors.checkout.length === 0}
                  hint={`Durasi ${BATAS_HOTEL.MIN_DURASI_JAM} jam sampai ${BATAS_HOTEL.MAKS_DURASI_HARI} hari.`}
                >
                  {(aria) => (
                    <input
                      id="checkout"
                      name="checkout"
                      type="datetime-local"
                      className="input"
                      value={form.checkout}
                      min={form.checkin || minCheckin}
                      onChange={ubah}
                      onBlur={blur}
                      disabled={loading}
                      {...aria}
                    />
                  )}
                </Field>
              </div>
              <p className="catatan-tarif">
                Biaya dihitung per 24 jam dan dibulatkan ke atas (minimal 1 hari).
              </p>
            </section>
          </div>

          <aside className="ringkasan">
            <h2>Ringkasan pesanan</h2>
            <dl>
              <div><dt>Layanan</dt><dd>Pet Hotel</dd></div>
              <div><dt>Hewan</dt><dd>{petTerpilih?.nama_pet || <em>Belum dipilih</em>}</dd></div>
              <div><dt>Check-in</dt><dd>{form.checkin && !errors.checkin.length ? formatTanggalWaktu(form.checkin) : <em>—</em>}</dd></div>
              <div><dt>Check-out</dt><dd>{form.checkout && !errors.checkout.length ? formatTanggalWaktu(form.checkout) : <em>—</em>}</dd></div>
              <div><dt>Durasi</dt><dd>{durasi ? `${durasi} hari` : <em>—</em>}</dd></div>
              <div><dt>Tarif per hari</dt><dd>{rupiah(HOTEL_TARIF_PER_HARI)}</dd></div>
            </dl>
            <div className="ringkasan__total">
              <span>Perkiraan total</span>
              <strong>{perkiraan !== null ? rupiah(perkiraan) : '—'}</strong>
            </div>
            <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
              {loading ? 'Membuat pesanan…' : 'Buat pesanan'}
            </button>
            <p className="ringkasan__catatan">Total akhir dihitung oleh sistem saat pesanan dibuat.</p>
          </aside>
        </form>
      )}
    </AppShell>
  );
}
