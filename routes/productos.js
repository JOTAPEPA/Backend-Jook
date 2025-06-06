import { Router } from 'express';
import productosController from '../controllers/productos.js';
import ValidarJWT from '../Middlewares/ValidarJWT.js';
import multer from 'multer'; // Asegúrate de que multer esté importado

const router = Router();

const uploadProductAndMarcaImages = multer({ dest: 'uploads/temp/' });

// Middleware para subir imágenes de productos
const productUpload = uploadProductAndMarcaImages.fields([
  { name: 'images', maxCount: 4 },
  { name: 'marcaImagen', maxCount: 1 } // Si también subes imagen de marca con el producto
]);

// Rutas de productos
router.post('/', productUpload, productosController.createProducto);
router.put('/id/:id', productUpload, productosController.updateProducto);
router.get('/', productosController.getProductos); // Puede filtrar por marca en query
router.get('/search', productosController.buscarProductos);
router.get('/id/:id', productosController.getProductoById);
router.put('/id/:id/:estado', productosController.changeProductoEstado); 
router.post('/resena/:id', ValidarJWT.validarJWT, productosController.agregarReseña);
router.delete('/:id/resena/:reviewId', ValidarJWT.validarJWT, productosController.eliminarReseña);
router.get('/categoria/:categoriaId', productosController.getProductosPorCategoria);
router.get('/marca/:id/productos', productosController.getProductosDeMarcaId); 
router.get('/marca/:id', productosController.getMarcaById); 
router.get('/marcas', productosController.getTodasLasMarcas);
router.get('/tipos-de-uso', productosController.getTodosLosTiposDeUso);

export default router;