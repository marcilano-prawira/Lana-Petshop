import { Router } from 'express';
import paketGroomingRoutes from './paketGroomingRoutes.js';
import pesananRoutes from './pesananRoutes.js';
import petHotelRoutes from './petHotelRoutes.js';
import pembayaranRoutes from './pembayaranRoutes.js';
import progressRoutes from './progressRoutes.js';
import laporanRoutes from './laporanRoutes.js';

const router = Router();

router.use('/paket-grooming', paketGroomingRoutes);
router.use('/pesanan', pesananRoutes);
router.use('/pet-hotel', petHotelRoutes);
router.use('/pembayaran', pembayaranRoutes);
router.use('/progress', progressRoutes);
router.use('/laporan', laporanRoutes);

export default router;
