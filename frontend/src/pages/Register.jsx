import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout, Field, Notice, PasswordInput } from "../components/ui.jsx";
import { request } from "../lib/api.js";
import {
  validasiAlamat,
  validasiJenisKelamin,
  validasiKonfirmasiPassword,
  validasiNama,
  validasiNoHp,
  validasiPasswordRegistrasi,
  validasiUsername,
  skorPassword,
} from "../lib/validators.js";

const AWAL = {
  nama_customer: "",
  username: "",
  jenis_kelamin: "",
  no_hp_customer: "",
  alamat_customer: "",
  password: "",
  konfirmasi: "",
};

const URUTAN = [
  "nama_customer",
  "username",
  "jenis_kelamin",
  "no_hp_customer",
  "alamat_customer",
  "password",
  "konfirmasi",
];

const LABEL_KEKUATAN = ["Belum diisi", "Lemah", "Cukup", "Kuat", "Sangat kuat"];

function aturanPassword(p, username) {
  const u = username.trim().toLowerCase();
  return [
    { label: "Minimal 8 karakter", ok: p.length >= 8 },
    { label: "Huruf kecil (a–z)", ok: /[a-z]/.test(p) },
    { label: "Huruf kapital (A–Z)", ok: /[A-Z]/.test(p) },
    { label: "Angka (0–9)", ok: /[0-9]/.test(p) },
    { label: "Simbol (! @ # $ %)", ok: /[^A-Za-z0-9\s]/.test(p) },
    { label: "Tanpa spasi", ok: p.length > 0 && !/\s/.test(p) },
    {
      label: "Tidak memuat username",
      ok: p.length > 0 && !(u.length >= 4 && p.toLowerCase().includes(u)),
    },
  ];
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(AWAL);
  const [touched, setTouched] = useState({});
  const [sudahCoba, setSudahCoba] = useState(false);
  const [errorServer, setErrorServer] = useState("");
  const [usernameDipakai, setUsernameDipakai] = useState(""); // username yang ditolak server
  const [loading, setLoading] = useState(false);

  const errors = {
    nama_customer: validasiNama(form.nama_customer),
    username: [
      ...validasiUsername(form.username, { mode: "register" }),
      ...(usernameDipakai && usernameDipakai === form.username
        ? [`Username "${form.username}" sudah digunakan. Pilih username lain.`]
        : []),
    ],
    jenis_kelamin: validasiJenisKelamin(form.jenis_kelamin),
    no_hp_customer: validasiNoHp(form.no_hp_customer),
    alamat_customer: validasiAlamat(form.alamat_customer),
    password: validasiPasswordRegistrasi(form.password, form.username),
    konfirmasi: validasiKonfirmasiPassword(form.password, form.konfirmasi),
  };

  const tampil = (f) => sudahCoba || Boolean(touched[f]);
  const skor = skorPassword(form.password);
  const aturan = aturanPassword(form.password, form.username);

  const ubah = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrorServer("");
  };
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const kirim = async (e) => {
    e.preventDefault();
    if (loading) return;

    setSudahCoba(true);
    setErrorServer("");

    const pertama = URUTAN.find((f) => errors[f].length > 0);
    if (pertama) {
      const el =
        document.getElementById(pertama) ||
        document.querySelector(`[name="${pertama}"]`);
      el?.focus();
      return;
    }

    setLoading(true);
    try {
      const alamat = form.alamat_customer.trim();
      const res = await request("/auth/registrasi", {
        method: "POST",
        body: {
          username: form.username,
          password: form.password,
          jenis_kelamin: form.jenis_kelamin,
          nama_customer: form.nama_customer.trim(),
          alamat_customer: alamat || null,
          no_hp_customer: form.no_hp_customer,
        },
      });
      navigate("/login", {
        replace: true,
        state: {
          notice: {
            tipe: "success",
            teks: res.message || "Akun berhasil dibuat, silakan login.",
          },
          username: form.username,
        },
      });
    } catch (err) {
      if (err.status === 409) {
        setUsernameDipakai(form.username);
        document.getElementById("username")?.focus();
      } else {
        setErrorServer(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const f = (nama) => ({
    id: nama,
    name: nama,
    value: form[nama],
    onChange: ubah,
    onBlur: blur,
    disabled: loading,
  });

  return (
    <AuthLayout
      judul="Buat akun baru"
      subjudul="Daftar sebagai pelanggan Lana Petshop. Semua data diperiksa agar akun Anda aman."
      footer={
        <>
          Sudah punya akun? <Link to="/login">Masuk di sini</Link>
        </>
      }
    >
      {errorServer && <Notice tipe="error">{errorServer}</Notice>}

      <form onSubmit={kirim} noValidate className="form form--grid">
        <div className="span-2">
          <Field
            id="nama_customer"
            label="Nama lengkap*"
            errors={errors.nama_customer}
            tampilkanError={tampil("nama_customer")}
            valid={errors.nama_customer.length === 0}
          >
            {(aria) => (
              <input
                {...f("nama_customer")}
                type="text"
                className="input"
                autoComplete="name"
                placeholder="Nama sesuai identitas"
                autoFocus
                {...aria}
              />
            )}
          </Field>
        </div>

        <Field
          id="username"
          label="Username*"
          errors={errors.username}
          tampilkanError={tampil("username")}
          valid={errors.username.length === 0}
          hint="Huruf kecil, angka, titik, underscore. 4–50 karakter."
        >
          {(aria) => (
            <input
              {...f("username")}
              type="text"
              className="input"
              autoComplete="username"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="contoh: lana_pet"
              {...aria}
            />
          )}
        </Field>

        <div
          className={`field ${tampil("jenis_kelamin") && errors.jenis_kelamin.length ? "field--error" : ""}`}
        >
          <span className="field__label" id="jk-label">
            Jenis kelamin*
          </span>
          <div
            className="radio-group"
            role="radiogroup"
            aria-labelledby="jk-label"
          >
            {[
              ["L", "Laki-laki"],
              ["P", "Perempuan"],
            ].map(([nilai, label], i) => (
              <label
                key={nilai}
                className={`radio ${form.jenis_kelamin === nilai ? "radio--on" : ""}`}
              >
                <input
                  type="radio"
                  id={i === 0 ? "jenis_kelamin" : undefined}
                  name="jenis_kelamin"
                  value={nilai}
                  checked={form.jenis_kelamin === nilai}
                  onChange={ubah}
                  onBlur={blur}
                  disabled={loading}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="field__messages" aria-live="polite">
            {tampil("jenis_kelamin") && errors.jenis_kelamin.length > 0 && (
              <ul className="field__errors">
                {errors.jenis_kelamin.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Field
          id="no_hp_customer"
          label="Nomor HP*"
          errors={errors.no_hp_customer}
          tampilkanError={tampil("no_hp_customer")}
          valid={errors.no_hp_customer.length === 0}
          hint="Angka saja, contoh: 081234567890"
        >
          {(aria) => (
            <input
              {...f("no_hp_customer")}
              type="tel"
              inputMode="numeric"
              className="input"
              autoComplete="tel"
              placeholder="081234567890"
              {...aria}
            />
          )}
        </Field>

        <Field
          id="alamat_customer"
          label={
            <>
              Alamat <span className="optional">(opsional)</span>
            </>
          }
          errors={errors.alamat_customer}
          tampilkanError={tampil("alamat_customer")}
          valid={
            form.alamat_customer.trim().length > 0 &&
            errors.alamat_customer.length === 0
          }
        >
          {(aria) => (
            <input
              {...f("alamat_customer")}
              type="text"
              className="input"
              autoComplete="street-address"
              placeholder="Jalan, nomor, kota"
              {...aria}
            />
          )}
        </Field>

        <Field
          id="password"
          label="Password*"
          errors={errors.password}
          tampilkanError={tampil("password")}
          valid={errors.password.length === 0}
        >
          {(aria) => (
            <PasswordInput
              id="password"
              nilai={form.password}
              onChange={ubah}
              onBlur={blur}
              autoComplete="new-password"
              placeholder="Buat password"
              ariaProps={aria}
              disabled={loading}
            />
          )}
        </Field>

        <Field
          id="konfirmasi"
          label="Konfirmasi password*"
          errors={errors.konfirmasi}
          tampilkanError={tampil("konfirmasi")}
          valid={errors.konfirmasi.length === 0}
        >
          {(aria) => (
            <PasswordInput
              id="konfirmasi"
              nilai={form.konfirmasi}
              onChange={ubah}
              onBlur={blur}
              autoComplete="new-password"
              placeholder="Ulangi password"
              ariaProps={aria}
              disabled={loading}
            />
          )}
        </Field>

        <div className="span-2 pw-rules" aria-live="polite">
          <div className="pw-meter" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={`pw-meter__bar ${skor >= n ? `pw-meter__bar--${skor}` : ""}`}
              />
            ))}
          </div>
          <p className="pw-meter__label">
            Kekuatan password: <strong>{LABEL_KEKUATAN[skor]}</strong>
          </p>
          <ul className="pw-checklist">
            {aturan.map((a) => (
              <li key={a.label} className={a.ok ? "ok" : ""}>
                <span aria-hidden="true">{a.ok ? "✓" : "○"}</span> {a.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="span-2">
          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={loading}
          >
            {loading ? "Membuat akun…" : "Daftar"}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
