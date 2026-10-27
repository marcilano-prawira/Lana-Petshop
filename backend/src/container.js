// Merakit semua object (dependency injection sederhana)
import UserRepository from './repositories/UserRepository.js';
import CustomerRepository from './repositories/CustomerRepository.js';
import TokenRepository from './repositories/TokenRepository.js';
import PetRepository from './repositories/PetRepository.js';
import PaketGroomingRepository from './repositories/PaketGroomingRepository.js';
import PesananRepository from './repositories/PesananRepository.js';
import PetHotelRepository from './repositories/PetHotelRepository.js';
import PembayaranRepository from './repositories/PembayaranRepository.js';
import ProgressRepository from './repositories/ProgressRepository.js';
import LaporanRepository from './repositories/LaporanRepository.js';

import TokenService from './services/TokenService.js';
import AuthService from './services/AuthService.js';
import PaketGroomingService from './services/PaketGroomingService.js';
import PesananService from './services/PesananService.js';
import PetHotelService from './services/PetHotelService.js';
import PembayaranService from './services/PembayaranService.js';
import ProgressService from './services/ProgressService.js';
import LaporanService from './services/LaporanService.js';

import AuthController from './controllers/AuthController.js';
import PaketGroomingController from './controllers/PaketGroomingController.js';
import PesananController from './controllers/PesananController.js';
import PetHotelController from './controllers/PetHotelController.js';
import PembayaranController from './controllers/PembayaranController.js';
import ProgressController from './controllers/ProgressController.js';
import LaporanController from './controllers/LaporanController.js';

import AuthMiddleware from './middlewares/AuthMiddleware.js';

const userRepository = new UserRepository();
const customerRepository = new CustomerRepository();
const tokenRepository = new TokenRepository();
const tokenService = new TokenService();
const petRepository = new PetRepository();
const paketRepository = new PaketGroomingRepository();
const pesananRepository = new PesananRepository();
const hotelRepository = new PetHotelRepository();
const pembayaranRepository = new PembayaranRepository();
const progressRepository = new ProgressRepository();
const laporanRepository = new LaporanRepository();

const authService = new AuthService({ userRepository, customerRepository, tokenRepository, tokenService });
const paketService = new PaketGroomingService(paketRepository);
const pesananService = new PesananService({ pesananRepository, petRepository, paketRepository, hotelRepository, progressRepository });
const hotelService = new PetHotelService({ hotelRepository, pesananRepository, pembayaranRepository });
const pembayaranService = new PembayaranService({ pembayaranRepository, pesananRepository, progressRepository });
const progressService = new ProgressService({ progressRepository, pesananRepository });
const laporanService = new LaporanService(laporanRepository);

export const auth = new AuthMiddleware({ tokenService, tokenRepository, userRepository });
export const authController = new AuthController(authService);
export const paketController = new PaketGroomingController(paketService);
export const pesananController = new PesananController(pesananService, petRepository);
export const hotelController = new PetHotelController(hotelService);
export const pembayaranController = new PembayaranController(pembayaranService);
export const progressController = new ProgressController(progressService);
export const laporanController = new LaporanController(laporanService);
