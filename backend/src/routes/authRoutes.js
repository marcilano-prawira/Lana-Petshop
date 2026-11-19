import { Router } from 'express';
import { auth, authController as c } from '../container.js';

const router = Router();

router.post('/registrasi', c.registrasi);               // publik (Customer)
router.post('/login', c.login);                         // publik (Admin, Customer)
router.post('/logout', auth.identifikasi, c.logout);    // Admin, Customer
router.get('/saya', auth.identifikasi, c.saya);         // Admin, Customer
router.patch('/profil', auth.identifikasi, c.perbaruiProfil); // Admin, Customer: ubah username, alamat, foto
router.post('/password/verifikasi', auth.identifikasi, c.verifikasiPasswordLama); // langkah 1: cek password lama
router.put('/password', auth.identifikasi, c.gantiPassword);                      // langkah 2: simpan password baru

export default router;
