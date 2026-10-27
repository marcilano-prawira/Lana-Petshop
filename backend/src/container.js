// Merakit semua object (dependency injection sederhana)
import UserRepository from './repositories/UserRepository.js';
import PetRepository from './repositories/PetRepository.js';
import PaketGroomingRepository from './repositories/PaketGroomingRepository.js';
import PesananRepository from './repositories/PesananRepository.js';
import PetHotelRepository from './repositories/PetHotelRepository.js';
import PembayaranRepository from './repositories/PembayaranRepository.js';
import ProgressRepository from './repositories/ProgressRepository.js';
import LaporanRepository from './repositories/LaporanRepository.js';

import PaketGroomingService from './services/PaketGroomingService.js';
import PesananService from './services/PesananService.js';
import PetHotelService from './services/PetHotelService.js';
import PembayaranService from './services/PembayaranService.js';
import ProgressService from './services/ProgressService.js';
import LaporanService from './services/LaporanService.js';

import PaketGroomingController from './controllers/PaketGroomingController.js';
import PesananController from './controllers/PesananController.js';
import PetHotelController from './controllers/PetHotelController.js';
import PembayaranController from './controllers/PembayaranController.js';
import ProgressController from './controllers/ProgressController.js';
import LaporanController from './controllers/LaporanController.js';

import AuthMiddleware from './middlewares/AuthMiddleware.js';

const userRepository = new UserRepository();
const petRepository = new PetRepository();
const paketRepository = new PaketGroomingRepository();
const pesananRepository = new PesananRepository();
const hotelRepository = new PetHotelRepository();
const pembayaranRepository = new PembayaranRepository();
const progressRepository = new ProgressRepository();
const laporanRepository = new LaporanRepository();

const paketService = new PaketGroomingService(paketRepository);
const pesananService = new PesananService({ pesananRepository, petRepository, paketRepository, hotelRepository, progressRepository });
const hotelService = new PetHotelService({ hotelRepository, pesananRepository, pembayaranRepository });
const pembayaranService = new PembayaranService({ pembayaranRepository, pesananRepository, progressRepository });
const progressService = new ProgressService({ progressRepository, pesananRepository });
const laporanService = new LaporanService(laporanRepository);

export const auth = new AuthMiddleware(userRepository);
export const paketController = new PaketGroomingController(paketService);
export const pesananController = new PesananController(pesananService, petRepository);
export const hotelController = new PetHotelController(hotelService);
export const pembayaranController = new PembayaranController(pembayaranService);
export const progressController = new ProgressController(progressService);
export const laporanController = new LaporanController(laporanService);
