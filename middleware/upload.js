// middleware/upload.js
const multer = require('multer');
const path = require('path');

// Config stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Dossier de stockage
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // Nom unique avec extension
  }
});

const upload = multer({ storage });

module.exports = upload;
