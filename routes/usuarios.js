import { Router } from "express";
import { check } from "express-validator";
import usuariosController from "../controllers/usuarios.js";

const router = Router()

router.post("/", usuariosController.createUser);
router.get ("/",usuariosController.getUsers);
router.get("/:id", usuariosController.getUserById);
router.put("/",usuariosController.updateUser);

export default router;
