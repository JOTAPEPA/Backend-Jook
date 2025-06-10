import { Router } from 'express';
import productosController from '../controllers/productos.js';
import ValidarJWT from '../Middlewares/ValidarJWT.js';
import multer from 'multer';

const router = Router();

// Configuración de Multer para guardar las imágenes temporalmente
const uploadProductAndMarcaImages = multer({ dest: 'uploads/temp/' });

// Middleware para subir imágenes de productos
const productUpload = uploadProductAndMarcaImages.fields([
  { name: 'images', maxCount: 4 },
  { name: 'marcaImagen', maxCount: 1 } // Si también subes imagen de marca con el producto
]);

router.post('/', productUpload, productosController.createProducto);
router.put('/id/:id', productUpload, productosController.updateProducto);
router.get('/', productosController.getProductos);
router.get('/search', productosController.buscarProductos);
router.get('/id/:id', productosController.getProductoById);
router.put('/id/:id/estado', productosController.changeProductoEstado); 
router.post('/resena/:id', ValidarJWT.validarJWT, productosController.agregarReseña);
router.delete('/:id/resena/:reviewId', ValidarJWT.validarJWT, productosController.eliminarReseña);
router.get('/categoria/:categoriaId', productosController.getProductosPorCategoria);
router.get('/marca/:id/productos', productosController.getProductosDeMarcaId);
router.get('/marca/:id', productosController.getMarcaById);
router.get('/marcas', productosController.getTodasLasMarcas);
router.get('/tipos-de-uso', productosController.getTodosLosTiposDeUso);
router.post('/id/:id/oferta', productosController.activarOferta);
router.delete('/id/:id/oferta', productosController.desactivarOferta);
router.get('/ofertas', productosController.getProductosConOfertasActivas); 
router.get('/id/:id/estado-oferta', productosController.getEstadoOfertaProducto);

export default router;