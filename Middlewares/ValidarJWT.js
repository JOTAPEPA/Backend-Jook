import jwt from "jsonwebtoken"
import Usuarios from "../Models/usuarios.js"


const generarJWT = (uid) => {
    return new Promise((resolve, reject) => {
        const payload = { uid };
        console.log('Generando JWT con expiración de 30 días');
        jwt.sign(
            payload,
            process.env.SECRETORPRIVATEKEY,
            { expiresIn: "30d" },
            (err, token) => {
                if (err) {
                    console.log(err);
                    reject("No se pudo generar el token");
                } else {
                    resolve(token);
                }
            }
        );
    });
};

// Función para validar JWT
const validarJWT = async (req, res, next) => {
    const authHeader = req.header("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
        return res.status(401).json({ msg: "No hay token en la petición" });
    }

    try {
        const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);
        const usuario = await Usuarios.findById(uid).select("estado");

        if (!usuario) {
            return res.status(401).json({ msg: "Token no válido - usuario no existe" });
        }

        if (!usuario.estado) {
            return res.status(401).json({ msg: "Token no válido - usuario inactivo" });
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({ msg: "Token no válido" });
    }
};



export default { generarJWT, validarJWT };