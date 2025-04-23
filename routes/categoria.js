import { Router } from "express";
import { check } from "express-validator";
import categoriaController from "../controllers/categoria";
const router = Router()

router.post("/",categoriaController.createCategoria);
router.get("/",categoriaController.getCategorias);
router.get("/:id",categoriaController.getCategoriaById);
router.put("/",categoriaController.updateCategoria);

export default router;