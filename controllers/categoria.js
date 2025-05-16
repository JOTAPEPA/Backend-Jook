import Categoria from "../Models/categoria.js";

const categoriaController = {
  // Crear una nueva categoría
  createCategoria: async (req, res) => {
    try {
      const categoria = new Categoria(req.body);
      await categoria.save();
      res.status(201).json({ message: "Categoría creada exitosamente", categoria });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener todas las categorías
  getCategorias: async (req, res) => {
    try {
      const categorias = await Categoria.find();
      res.json(categorias);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener una categoría por ID
  getCategoriaById: async (req, res) => {
    try {
      const { id } = req.params;
      const categoria = await Categoria.findById(id);
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      res.json(categoria);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Editar una categoría
  updateCategoria: async (req, res) => {
    try {
      const { name, description, estado } = req.body;
      const updatedCategoria = await Categoria.findByIdAndUpdate(
        req.params.id,
        { name, description, estado },
        { new: true }
      );
      if (!updatedCategoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      res.status(200).json({ message: "Categoría actualizada", categoria: updatedCategoria });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Activar una categoría
  activarCategoria: async (req, res) => {
    try {
      const categoria = await Categoria.findByIdAndUpdate(
        req.params.id,
        { estado: true },
        { new: true }
      );
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      res.json({ message: "Categoría activada", categoria });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Inactivar una categoría
  inactivarCategoria: async (req, res) => {
    try {
      const categoria = await Categoria.findByIdAndUpdate(
        req.params.id,
        { estado: false },
        { new: true }
      );
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      res.json({ message: "Categoría inactivada", categoria });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export default categoriaController;