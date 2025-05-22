import { Router } from "express";
import { check } from "express-validator";
import usuariosController from "../controllers/usuarios.js";
import multer from "multer"; 
import ValidarJWT from '../Middlewares/ValidarJWT.js';

const upload = multer({ dest: "uploads/" }); 

const router = Router();

router.post("/", usuariosController.createUser);
router.post("/login", usuariosController.loginUsuario); 
router.get("/perfil/:id", ValidarJWT.validarJWT, usuariosController.getProfile);
router.get("/favoritos", ValidarJWT.validarJWT, usuariosController.getFavoritos); // Mover antes
router.post("/upload-profile-pic", upload.single("profilePic"), usuariosController.uploadProfilePic);
router.get("/", usuariosController.getUsers);
router.post("/favoritos/:productId", ValidarJWT.validarJWT, usuariosController.toggleFavorito); // También corregí "//:productId"
router.get("/:id", usuariosController.getUserById); // Esta debe ir al final entre las rutas GET
router.put("/:id", usuariosController.updateUser);

export default router;
