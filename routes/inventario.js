import { Router } from "express";
import { check } from "express-validator";
import inventarioController from "../controllers/inventario.js";

const router = Router()

router.post("/",inventarioController.createInventario);
router.get("/",inventarioController.getInventarios);
router.get("/:id",inventarioController.getInventarioById);
router.put("/",inventarioController.updateInventario);

export default router;