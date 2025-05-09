import express from 'express';
import cloudinary from '../utils/cloudinary.js'; // ajusta la ruta según tu estructura
import multer from 'multer';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // continua usando multer como antes

router.post('/upload', upload.array('images', 4), async (req, res) => { // permite hasta 4 imágenes
  try {
    const uploadedUrls = [];
    
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path);
      fs.unlinkSync(file.path); // elimina el archivo local
      uploadedUrls.push(result.secure_url); // almacena la URL
    }

    res.json({ urls: uploadedUrls }); // devuelves todas las URLs de las imágenes
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
