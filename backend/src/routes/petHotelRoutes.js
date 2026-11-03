import { Router } from 'express';
import { auth, hotelController as c } from '../container.js';

const router = Router();
router.use(auth.identifikasi);

router.get('/', c.lihat);                                   // Customer, Admin
router.get('/:id', c.lihatById);                            // Customer, Admin
router.put('/:id', auth.izinkan('ADMIN'), c.edit);          // Admin
router.delete('/:id', auth.izinkan('ADMIN'), c.hapus);      // Admin

export default router;
