import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import PesanGrooming from './pages/PesanGrooming.jsx';
import PesanHotel from './pages/PesanHotel.jsx';
import HewanSaya from './pages/HewanSaya.jsx';
import PesananSaya from './pages/PesananSaya.jsx';
import Bayar from './pages/Bayar.jsx';
import AdminPembayaran from './pages/AdminPembayaran.jsx';

// Halaman yang butuh login
function Terlindungi({ children, peran }) {
  const { terautentikasi, user } = useAuth();
  if (!terautentikasi) return <Navigate to="/login" replace />;
  if (peran && user.role !== peran) return <Navigate to="/home" replace />;
  return children;
}

// Halaman tamu (login/registrasi): yang sudah login diarahkan ke home
function Tamu({ children }) {
  const { terautentikasi } = useAuth();
  return terautentikasi ? <Navigate to="/home" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<Tamu><Login /></Tamu>} />
      <Route path="/registrasi" element={<Tamu><Register /></Tamu>} />
      <Route path="/home" element={<Terlindungi><Home /></Terlindungi>} />
      <Route path="/pesan-grooming" element={<Terlindungi><PesanGrooming /></Terlindungi>} />
      <Route path="/pesan-hotel" element={<Terlindungi><PesanHotel /></Terlindungi>} />
      <Route path="/hewan-saya" element={<Terlindungi><HewanSaya /></Terlindungi>} />
      <Route path="/pesanan" element={<Terlindungi><PesananSaya /></Terlindungi>} />
      <Route path="/bayar/:idPesanan" element={<Terlindungi><Bayar /></Terlindungi>} />
      <Route path="/admin/pembayaran" element={<Terlindungi peran="ADMIN"><AdminPembayaran /></Terlindungi>} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
