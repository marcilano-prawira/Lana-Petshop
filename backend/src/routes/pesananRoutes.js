import { Router } from 'express';
import { auth, pesananController as c } from '../container.js';

const router = Router();
router.use(auth.identifikasi);

router.get('/pet-saya', auth.izinkan('CUSTOMER'), c.lihatPetSaya);
router.post('/grooming', auth.izinkan('CUSTOMER'), c.pesanGrooming);
router.post('/hotel', auth.izinkan('CUSTOMER'), c.pesanHotel);
router.get('/', c.lihat);                                   // Admin: semua, Customer: miliknya
router.get('/:id', c.lihatById);
router.patch('/:id/batal', auth.izinkan('CUSTOMER'), c.batal);

export default router;
