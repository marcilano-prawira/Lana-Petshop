import { Router } from 'express';
import { auth, laporanController as c } from '../container.js';

const router = Router();
router.use(auth.identifikasi, auth.izinkan('ADMIN'));

router.post('/', c.tambah);
router.get('/', c.lihat);               // ?bulan=10&tahun=2026
router.get('/:id', c.lihatById);

export default router;
