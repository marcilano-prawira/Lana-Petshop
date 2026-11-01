import { API_URL } from '../config.js';

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const TIMEOUT_MS = 15000;

// Format respons backend: { success, message, data }
export async function request(path, { method = 'GET', body, token } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('Server terlalu lama merespons. Coba lagi beberapa saat.', 0);
    }
    throw new ApiError('Tidak dapat terhubung ke server. Pastikan backend berjalan dan koneksi internet aktif.', 0);
  } finally {
    clearTimeout(timer);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    // respons bukan JSON
  }

  if (!res.ok || (json && json.success === false)) {
    throw new ApiError(json?.message || `Permintaan gagal (kode ${res.status}).`, res.status);
  }

  return json;
}
