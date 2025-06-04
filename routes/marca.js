import express from 'express';
import marcaController from '../controllers/marca.js'; 
import multer from 'multer'; 

const router = express.Router();


const uploadMarcaImage = multer({ dest: 'uploads/' });
router.post('/', uploadMarcaImage.single('imagenMarca'), marcaController.createMarca);
router.put('/:id', uploadMarcaImage.single('imagenMarca'), marcaController.updateMarca);
router.get('/', marcaController.getAllMarcas);
router.put('/:id/:estado', marcaController.changeMarcaEstado);

export default router;