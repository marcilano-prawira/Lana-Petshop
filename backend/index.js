import app from './src/app.js';
import db from './src/config/database.js';

const PORT = Number(process.env.PORT) || 3000;

try {
  const waktu = await db.testConnection();
  console.log(`Database terhubung (${waktu.toISOString()})`);
} catch (err) {
  console.error('Gagal terhubung ke database:', err.message);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server Lana PetShop Alhamdulillah berjalan di http://localhost:${PORT}`);
});
