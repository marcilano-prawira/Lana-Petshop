import { Router } from 'express';
import { auth, authController as c } from '../container.js';

const router = Router();

router.post('/registrasi', c.registrasi);               // publik (Customer)
router.post('/login', c.login);                         // publik (Admin, Customer)
router.post('/logout', auth.identifikasi, c.logout);    // Admin, Customer
router.get('/saya', auth.identifikasi, c.saya);         // Admin, Customer

export default router;
