import { Router } from "express";
import { check } from "express-validator";
import ordenesController from "../controllers/ordenes";

const router = Router()

router.post("/", ordenesController.createOrden);
router.get("/",ordenesController.getOrdenes);
router.get("/:id",ordenesController.getOrdenById);
router.put("/",ordenesController.updateOrden);

export default router;