import { Router } from 'express';
import productosController from '../controllers/productos.js';
import ValidarJWT from '../Middlewares/ValidarJWT.js';
import multer from 'multer';

const router = Router();

const uploadProductAndMarcaImages = multer({ dest: 'uploads/temp/' });

const productUpload = uploadProductAndMarcaImages.fields([
  { name: 'images', maxCount: 4 },
  { name: 'marcaImagen', maxCount: 1 }
]);
router.post('/', productUpload, productosController.createProducto);
router.put('/id/:id', productUpload, productosController.updateProducto);
router.get('/', productosController.getProductos);
router.get('/search', productosController.buscarProductos);
router.get('/id/:id', productosController.getProductoById);
router.put('/id/:id/:estado', productosController.changeProductoEstado);
router.post('/resena/:id', ValidarJWT.validarJWT, productosController.agregarReseña);
router.delete('/:id/resena/:reviewId', ValidarJWT.validarJWT, productosController.eliminarReseña);
router.get('/categoria/:categoriaId', productosController.getProductosPorCategoria);
router.get('/marca/:marca', productosController.getProductosPorMarca);
router.get('/marcas', productosController.getTodasLasMarcas);
router.get('/tipos-de-uso', productosController.getTodosLosTiposDeUso);

export default router;