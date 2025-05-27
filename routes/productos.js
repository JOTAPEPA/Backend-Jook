import { Router } from "express";
import { check } from "express-validator";
import productosController from "../controllers/productos.js";
import ValidarJWT from '../Middlewares/ValidarJWT.js';

const router = Router()

router.post("/",productosController.createProducto);
router.get("/", productosController.getProductos);
router.get('/search', productosController.buscarProductos);
router.get("/id/:id",productosController.getProductoById);
router.put("/id/:id",productosController.updateProducto);
router.put('/id/:id/activo', productosController.activarProducto);
router.put('/id/:id/inactivo', productosController.inactivarProducto);
router.post("/resena/:id", ValidarJWT.validarJWT, productosController.agregarReseña);
router.delete("/:id/resena/:reviewId", ValidarJWT.validarJWT, productosController.eliminarReseña);
router.get('/categoria/:categoriaId', productosController.getProductosPorCategoria);
router.get('/marca/:marca', productosController.getProductosPorMarca);
router.get('/marcas', productosController.getTodasLasMarcas); 

export default router;