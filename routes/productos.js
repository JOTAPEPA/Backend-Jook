import { Router } from "express";
import { check } from "express-validator";
import productosController from "../controllers/productos.js";

const router = Router()

router.post("/",productosController.createProducto);
router.get("/", productosController.getProductos);
router.get("/:id",productosController.getProductoById);
router.put("/:id",productosController.updateProducto);
router.put('/:id/activo', productosController.activarProducto);
router.put('/:id/inactivo', productosController.inactivarProducto);


export default router;