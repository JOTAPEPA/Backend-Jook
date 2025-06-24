import express from 'express';
import categoriaController from '../controllers/categoria.js';
import multer from 'multer';
import fs from 'fs'; // Necesario para asegurar que el directorio 'uploads/' exista

const router = express.Router();


const uploadCategoriaImage = multer({ dest: 'uploads/' });

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); 
}


// Rutas para Categorías

// Crear una nueva categoría con subida de imagen
// 'image' es el nombre del campo del archivo en tu formulario (FormData)
router.post('/', uploadCategoriaImage.single('image'), categoriaController.createCategoria);

// Actualizar una categoría existente con posible subida de imagen
// 'image' es el nombre del campo del archivo en tu formulario (FormData)
router.put('/:id', uploadCategoriaImage.single('image'), categoriaController.updateCategoria);

// Obtener todas las categorías
router.get('/', categoriaController.getCategorias);

// Obtener una categoría por ID (manteniendo el endpoint específico)
router.get('/:id', categoriaController.getCategoriaById);

// Cambiar el estado de una categoría (activo/inactivo)
// Este endpoint coincide con la función `changeCategoriaEstado` en tu controlador
router.put('/:id/:estado', categoriaController.changeCategoriaEstado);

// Eliminar una categoría
router.delete('/:id', categoriaController.deleteCategoria);


export default router;