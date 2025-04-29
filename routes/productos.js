import { Router } from "express";
import { check } from "express-validator";
import productosController from "../controllers/productos.js";

const router = Router()

router.post("/",productosController.createProducto);
router.get("/", productosController.getProductos);
router.get("/:id",productosController.getProductoById);
router.put("/",productosController.updateProducto);

export default router;