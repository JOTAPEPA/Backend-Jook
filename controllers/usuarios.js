import Usuario from "../Models/usuarios";

const usuariosController = {
  // Crear un nuevo usuario
  createUser: async (req, res) => {
    try {
      const usuario = new Usuario(req.body);
      await usuario.save();
      res.status(201).json({ message: "Usuario creado exitosamente", usuario });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener todos los usuarios
  getUsers: async (req, res) => {
    try {
      const usuarios = await Usuario.find();
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener un usuario por ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const usuario = await Usuario.findById(id);
      if (!usuario) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Editar usuario
  updateUser: async (req, res) => {
    try {
      const { name, email, role, estado } = req.body;
      const updatedUser = await Usuario.findByIdAndUpdate(
        req.params.id,
        { name, email, role, estado, updatedAt: Date.now() },
        { new: true }
      );
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.status(200).json({ message: "Usuario actualizado", usuario: updatedUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default usuariosController;
