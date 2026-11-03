export default class BaseController {
  sukses(res, message, data = null, status = 200) {
    res.status(status).json({ success: true, message, data });
  }

  // Express 5: req.body bisa undefined jika tidak ada body
  body(req) {
    return req.body ?? {};
  }
}
