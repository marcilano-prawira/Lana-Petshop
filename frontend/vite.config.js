import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Saat development, request ke /api diteruskan ke backend (port 3000),
// jadi tidak ada masalah CORS dan tidak perlu mengubah URL apa pun.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
