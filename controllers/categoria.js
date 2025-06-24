// Controllers/categoriaController.js
import Categoria from '../Models/categoria.js';
import cloudinary from "../utils/cloudinary.js"; // Assuming you have a cloudinary utility setup
import fs from 'fs/promises'; // For deleting local files after upload

const categoriaController = {
  // Obtener todas las categorías
  getCategorias: async (req, res) => {
    try {
      const categorias = await Categoria.find();
      res.status(200).json(categorias);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener las categorías', error: error.message });
    }
  },

  // Crear una nueva categoría con imagen
  createCategoria: async (req, res) => {
    const { name, description, image, estado } = req.body;
    let imageUrl = null;

    try {
      if (req.file) { // If a file was uploaded via multer
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'jook_categorias' // Specify your Cloudinary folder
        });
        imageUrl = result.secure_url;
        await fs.unlink(req.file.path); // Delete local file after successful upload
      } else if (image) { // If an image URL was provided directly in the body (e.g., existing image)
        imageUrl = image;
      }

      const newCategoria = new Categoria({
        name,
        description,
        image: imageUrl,
        estado: estado || 'activo' // Default to 'activo' if not provided
      });

      await newCategoria.save();
      res.status(201).json({ message: 'Categoría creada con éxito', categoria: newCategoria });
    } catch (error) {
      // If there was an error and a file was uploaded, delete it
      if (req.file) {
        await fs.unlink(req.file.path);
      }
      res.status(400).json({ message: 'Error al crear la categoría', error: error.message });
    }
  },

  // Obtener una categoría por ID
  getCategoriaById: async (req, res) => {
    try {
      const { id } = req.params;
      const categoria = await Categoria.findById(id);
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      res.status(200).json(categoria);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener la categoría', error: error.message });
    }
  },

  // Actualizar una categoría por ID con posible actualización de imagen
  updateCategoria: async (req, res) => {
    const { id } = req.params;
    const { name, description, estado, imagenExistente } = req.body;
    let imageUrl = imagenExistente || null; // Use existing image URL if provided

    try {
      const categoria = await Categoria.findById(id);
      if (!categoria) {
        if (req.file) await fs.unlink(req.file.path); // Clean up uploaded file if category not found
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }

      // Handle new image upload
      if (req.file) {
        // Delete old image from Cloudinary if it exists
        if (categoria.image) {
          const publicId = categoria.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`jook_categorias/${publicId}`);
        }
        // Upload new image
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'jook_categorias'
        });
        imageUrl = result.secure_url;
        await fs.unlink(req.file.path); // Delete local file
      } else if (req.body.eliminarImagenCategoria === 'true') { // Option to explicitly remove image
        if (categoria.image) {
          const publicId = categoria.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`jook_categorias/${publicId}`);
          imageUrl = null; // Set image to null in DB
        }
      }

      // Update category fields
      categoria.name = name || categoria.name;
      categoria.description = description || categoria.description;
      categoria.image = imageUrl;
      categoria.estado = estado || categoria.estado;

      await categoria.save();
      res.status(200).json({ message: 'Categoría actualizada con éxito', categoria });
    } catch (error) {
      if (req.file) await fs.unlink(req.file.path); // Clean up uploaded file if error occurs
      res.status(400).json({ message: 'Error al actualizar la categoría', error: error.message });
    }
  },

  // Cambiar estado de una categoría (activar/inactivar)
  changeCategoriaEstado: async (req, res) => {
    const { id, estado } = req.params; // 'estado' should be 'activo' or 'inactivo'
    try {
      const categoria = await Categoria.findByIdAndUpdate(id, { estado }, { new: true });
      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      res.status(200).json({ message: `Categoría ${estado} con éxito`, categoria });
    } catch (error) {
      res.status(500).json({ message: 'Error al cambiar el estado de la categoría', error: error.message });
    }
  },

  // Eliminar una categoría (con eliminación de imagen de Cloudinary)
  deleteCategoria: async (req, res) => {
    try {
      const { id } = req.params;
      const categoria = await Categoria.findById(id);

      if (!categoria) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }

      // If there's an image, delete it from Cloudinary
      if (categoria.image) {
        const publicId = categoria.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`jook_categorias/${publicId}`); // Assuming 'jook_categorias' folder
      }

      await Categoria.findByIdAndDelete(id);
      res.status(200).json({ message: 'Categoría eliminada exitosamente' });
    } catch (error) {
      console.error('Error al eliminar la categoría:', error);
      res.status(500).json({ message: 'Error al eliminar la categoría', error: error.message });
    }
  }
};

export default categoriaController;