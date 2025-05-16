import { Router } from "express";
import { check } from "express-validator";
import usuariosController from "../controllers/usuarios.js";
import multer from "multer"; 
import ValidarJWT from '../Middlewares/ValidarJWT.js';

const upload = multer({ dest: "uploads/" }); // carpeta temporal

const router = Router();

router.post("/", usuariosController.createUser);
router.post("/login", usuariosController.loginUsuario); 
router.get("/perfil/:id", ValidarJWT.validarJWT, usuariosController.getProfile);
router.get ("/", usuariosController.getUsers);
router.get("/:id", usuariosController.getUserById);
router.put("/:id", usuariosController.updateUser);
router.post("/upload-profile-pic", upload.single("profilePic"), usuariosController.uploadProfilePic);



export default router;
