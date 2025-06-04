import Tipo from '../Models/tipo.js';

const tipoController = {
  // Obtener todos los tipos
  getAllTipos: async (req, res) => {
    try {
      const tipos = await Tipo.find();
      res.status(200).json(tipos);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener los tipos', error: error.message });
    }
  },

  // Crear un nuevo tipo
  createTipo: async (req, res) => {
    const { nombre } = req.body;
    try {
      const newTipo = new Tipo({ nombre });
      await newTipo.save();
      res.status(201).json({ message: 'Tipo creado con éxito', tipo: newTipo });
    } catch (error) {
      res.status(400).json({ message: 'Error al crear el tipo', error: error.message });
    }
  },

  // Actualizar un tipo por ID
  updateTipo: async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    try {
      const tipo = await Tipo.findByIdAndUpdate(id, { nombre }, { new: true });
      if (!tipo) {
        return res.status(404).json({ message: 'Tipo no encontrado' });
      }
      res.status(200).json({ message: 'Tipo actualizado con éxito', tipo });
    } catch (error) {
      res.status(400).json({ message: 'Error al actualizar el tipo', error: error.message });
    }
  },

  // Cambiar estado de un tipo
  changeTipoEstado: async (req, res) => {
    const { id, estado } = req.params;
    try {
      const tipo = await Tipo.findByIdAndUpdate(id, { estado }, { new: true });
      if (!tipo) {
        return res.status(404).json({ message: 'Tipo no encontrado' });
      }
      res.status(200).json({ message: `Tipo ${estado} con éxito`, tipo });
    } catch (error) {
      res.status(500).json({ message: 'Error al cambiar el estado del tipo', error: error.message });
    }
  }
};

export default tipoController;