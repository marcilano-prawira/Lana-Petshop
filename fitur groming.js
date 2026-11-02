import { Router } from "express";
import pool from "../db.js";

const router = Router();

router.get("/mahasiswa", async (req, res) => {
  try {
    const r = await pool.query("SELECT nim, nama FROM mahasiswa ORDER BY nim");
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/periode", async (req, res) => {
  try {
    const r = await pool.query("SELECT id_periode, nama_periode FROM periode ORDER BY id_periode");
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kelas?id_periode=20241
router.get("/kelas", async (req, res) => {
  try {
    const { id_periode } = req.query;
    const r = await pool.query(
      `SELECT kl.id_kelas, kl.nama_kelas, kl.kuota, mk.kode_mk, mk.nama_mk, mk.sks
       FROM kelas kl
       JOIN mata_kuliah mk ON mk.kode_mk = kl.kode_mk
       WHERE ($1::text IS NULL OR kl.id_periode = $1)
       ORDER BY mk.nama_mk`,
      [id_periode || null]
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;