// routes/tipoRoutes.js
import express from 'express';
import tipoController from '../controllers/tipo.js'; 

const router = express.Router();

router.get('/', tipoController.getAllTipos);

router.post('/', tipoController.createTipo);

router.put('/:id', tipoController.updateTipo);

router.put('/:id/:estado', tipoController.changeTipoEstado);

export default router;