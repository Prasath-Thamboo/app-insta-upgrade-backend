// middleware/upload.js
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(), // 👈 on stocke en mémoire pour envoi direct vers Cloudinary
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('FORMAT_NOT_ALLOWED'), ok);
  },
});

module.exports = upload;
