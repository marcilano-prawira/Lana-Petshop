import { Router } from 'express';
import { auth, pembayaranController as c } from '../container.js';

const router = Router();
router.use(auth.identifikasi);

router.post('/', auth.izinkan('CUSTOMER'), c.bayar);                    // Customer
router.get('/', c.lihat);                                               // Admin: semua, Customer: miliknya
router.patch('/:id/verifikasi', auth.izinkan('ADMIN'), c.verifikasi);   // Admin

export default router;
