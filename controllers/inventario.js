import Inventario from "../Models/inventario.js";

const inventarioController = {
  // Crear un nuevo registro de inventario
  createInventario: async (req, res) => {
    try {
      const inventario = new Inventario(req.body);
      await inventario.save();
      res.status(201).json({ message: "Registro de inventario creado exitosamente", inventario });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener todos los registros de inventario
  getInventarios: async (req, res) => {
    try {
      const inventarios = await Inventario.find().populate("productos usuarios");
      res.json(inventarios);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener un registro de inventario por ID
  getInventarioById: async (req, res) => {
    try {
      const { id } = req.params;
      const inventario = await Inventario.findById(id).populate("productos usuarios");
      if (!inventario) {
        return res.status(404).json({ message: "Registro de inventario no encontrado" });
      }
      res.json(inventario);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Editar un registro de inventario
  updateInventario: async (req, res) => {
    try {
      const { productos, tipo, cantidad, usuarios, reason } = req.body;
      const updatedInventario = await Inventario.findByIdAndUpdate(
        req.params.id,
        { productos, tipo, cantidad, usuarios, reason, fecha: Date.now() },
        { new: true }
      ).populate("productos usuarios");
      if (!updatedInventario) {
        return res.status(404).json({ message: "Registro de inventario no encontrado" });
      }
      res.status(200).json({ message: "Registro de inventario actualizado", inventario: updatedInventario });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default inventarioController;
