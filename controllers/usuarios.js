import mongoose from "mongoose";
import usuarios from "../Models/usuarios.js";
import bcrypt from "bcryptjs";
import ValidarJWT from "../Middlewares/ValidarJWT.js";
import nodemailer from "nodemailer"; 
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";  

const httpUsuarios = {
  // Crear usuario
// Crear usuario
createUser: async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Verificar si ya existe el correo
    const existe = await usuarios.findOne({ email });
    if (existe) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // Encriptar la contraseña
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const nuevoUsuario = new usuarios({
      name,
      email,
      password: passwordHash,
      role,
    });

    // Guardar al nuevo usuario en la base de datos
    await nuevoUsuario.save();

    // Enviar correo de bienvenida
    const transporter = nodemailer.createTransport({
      service: 'gmail', 
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    const mailOptions = {
      from: `"Tu Sitio Web" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '¡Bienvenido a nuestra página!',
      html: `
        <h1>Hola ${name}!</h1>
        <p>Gracias por registrarte en nuestra web.</p>
        <h3>Tu perfil:</h3>
        <ul>
          <li>Nombre: ${name}</li>
          <li>Correo: ${email}</li>
          <li>Rol: ${role}</li>
        </ul>
        <p>¡Esperamos que disfrutes la experiencia!</p>
      `,
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    // Responder con el éxito del registro
    res.status(201).json({ mensaje: "Usuario creado exitosamente", usuario: nuevoUsuario });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error al crear el usuario" });
  }
},

loginUsuario: async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    // Buscar el usuario por su correo electrónico
    const usuario = await usuarios.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Comparar la contraseña
    const isMatch = await bcrypt.compare(password, usuario.password);  
    if (!isMatch) {
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    // Generar token JWT
    const token = await ValidarJWT.generarJWT(usuario._id);

    // Responder con el token y los datos del usuario
    res.json({
      token,  // Enviar el token generado
      user: usuario
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Falla en la operación" });
  }
},




  // Obtener todos los usuarios
  getUsers: async (req, res) => {
    try {
      const listaUsuarios = await usuarios.find();
      res.json(listaUsuarios);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener un usuario por ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const usuario = await usuarios.findById(id);
      if (!usuario) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar usuario
  updateUser: async (req, res) => {
    try {
      const { nombre, email, role, estado } = req.body;
      const usuarioActualizado = await usuarios.findByIdAndUpdate(
        req.params.id,
        { nombre, email, role, estado, updatedAt: Date.now() },
        { new: true }
      );
      if (!usuarioActualizado) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.status(200).json({ mensaje: "Usuario actualizado", usuario: usuarioActualizado });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },


  uploadProfilePic: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se ha subido ninguna imagen" });
      }
  
      // Subir la imagen a Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "usuarios",
      });
  
      // Eliminar archivo temporal
      fs.unlinkSync(req.file.path);
  
      const userId = req.body.userId;
      if (!userId) {
        return res.status(400).json({ error: "Falta el ID del usuario" });
      }
  
      // Guardar URL en el campo profilePic del usuario
      const usuarioActualizado = await usuarios.findByIdAndUpdate(
        userId,
        { profilePic: result.secure_url, updatedAt: Date.now() },
        { new: true }
      );
  
      if (!usuarioActualizado) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
  
      res.status(200).json({
        success: true,
        imageUrl: result.secure_url,
      });
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      res.status(500).json({ error: "Error al subir la imagen" });
    }
  },

  // Obtener perfil del usuario autenticado
getProfile: async (req, res) => {
  try {
    const userId = req.params.id; // viene del middleware ValidarJWT
    const usuario = await usuarios.findById(userId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(usuario);
  } catch (error) {
    res.status(800).json({ error: "Error al obtener el perfil" });
  }
}

  
};



export default httpUsuarios;
