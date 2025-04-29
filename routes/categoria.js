import { Router } from "express";
import { check } from "express-validator";
import categoriaController from "../controllers/categoria.js";
const router = Router()

router.post("/",categoriaController.createCategoria);
router.get("/",categoriaController.getCategorias);
router.get("/:id",categoriaController.getCategoriaById);
router.put("/",categoriaController.updateCategoria);
router.put('/activar/:id', categoriaController.activarCategoria);
router.put('/inactivar/:id', categoriaController.inactivarCategoria);


export default router;