import { Router } from 'express';
import { auth, progressController as c } from '../container.js';

const router = Router();
router.use(auth.identifikasi);

router.get('/', c.lihat);                                               // Customer (miliknya), Admin (semua)
router.get('/pesanan/:idPesanan', c.lihatByPesanan);                    // Customer (miliknya), Admin
router.post('/pesanan/:idPesanan', auth.izinkan('ADMIN'), c.update);    // Admin

export default router;
