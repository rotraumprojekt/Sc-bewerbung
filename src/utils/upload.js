const fs = require('fs');
const path = require('path');
const multer = require('multer');

// DATA_DIR kann per Umgebungsvariable gesetzt werden (z. B. fuer einen
// Persistent Disk Mountpoint bei Render), damit Fotos einen Neustart ueberleben.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('INVALID_FILE_TYPE'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }
});

module.exports = { upload, UPLOAD_DIR };
