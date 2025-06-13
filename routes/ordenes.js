import { Router } from "express";
import { check } from "express-validator";
import ordenesController from "../controllers/ordenes.js";

const router = Router()

router.post("/", ordenesController.createOrden);
router.get("/",ordenesController.getOrdenes);
router.get("/:id",ordenesController.getOrdenById);
router.put("/",ordenesController.updateOrden);

router.get("/usuario/:userId", ordenesController.getOrdersByUser);

export default router;