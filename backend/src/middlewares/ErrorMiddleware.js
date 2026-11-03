export default class ErrorMiddleware {
  static notFound(req, res) {
    res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
  }

  static handle(err, req, res, next) {
    let status = err.statusCode ?? err.status ?? 500;
    let message = err.message;

    if (!err.statusCode && !err.status) {
      switch (err.code) {
        case '23505':
          status = 409; message = 'Data sudah ada (duplikat)'; break;
        case '23503':
          status = 409; message = 'Data terhubung dengan data lain atau referensi tidak ditemukan'; break;
        case '23514':
          status = 400; message = 'Data melanggar aturan validasi database'; break;
        case '22P02':
        case '22007':
          status = 400; message = 'Format data tidak valid'; break;
        default:
          console.error(err);
          message = 'Terjadi kesalahan pada server';
      }
    }

    res.status(status).json({ success: false, message });
  }
}
