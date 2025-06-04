import Marca from '../Models/marca.js'; 
import cloudinary from "../utils/cloudinary.js";
import fs from 'fs/promises';

const marcaController = {
  // Obtener todas las marcas
  getAllMarcas: async (req, res) => {
    try {
      const marcas = await Marca.find();
      res.status(200).json(marcas);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener las marcas', error: error.message });
    }
  },

  // Crear una nueva marca
  createMarca: async (req, res) => {
    const { nombre, imagen } = req.body;
    let imagenUrl = null;
    
    try {
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'jook_marcas'
        });
        imagenUrl = result.secure_url;
        await fs.unlink(req.file.path);
      } else if (imagen) {
        imagenUrl = imagen; // ← agregar esta línea para usar imagen del body
      }
    
      const newMarca = new Marca({
        nombre,
        imagen: imagenUrl
      });
    
      await newMarca.save();
      res.status(201).json({ message: 'Marca creada con éxito', marca: newMarca });
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path);
      }
      res.status(400).json({ message: 'Error al crear la marca', error: error.message });
    }
    
  },

  // Actualizar una marca por ID
  updateMarca: async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    let imagenUrl = req.body.imagenExistente || null; // Si viene una imagen existente, la usamos

    try {
      const marca = await Marca.findById(id);
      if (!marca) {
        if (req.file) await fs.unlink(req.file.path);
        return res.status(404).json({ message: 'Marca no encontrada' });
      }

      if (req.file) {
        if (marca.imagen) {
          const publicId = marca.imagen.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`jook_marcas/${publicId}`);
        }
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'jook_marcas'
        });
        imagenUrl = result.secure_url;
        await fs.unlink(req.file.path);
      } else if (req.body.eliminarImagenMarca === 'true') {
          if (marca.imagen) {
              const publicId = marca.imagen.split('/').pop().split('.')[0];
              await cloudinary.uploader.destroy(`jook_marcas/${publicId}`);
              imagenUrl = null;
          }
      }

      marca.nombre = nombre || marca.nombre;
      marca.imagen = imagenUrl;

      await marca.save();
      res.status(200).json({ message: 'Marca actualizada con éxito', marca });
    } catch (error) {
      if (req.file) await fs.unlink(req.file.path);
      res.status(400).json({ message: 'Error al actualizar la marca', error: error.message });
    }
  },

  // Cambiar estado de una marca
  changeMarcaEstado: async (req, res) => {
    const { id, estado } = req.params;
    try {
      const marca = await Marca.findByIdAndUpdate(id, { estado }, { new: true });
      if (!marca) {
        return res.status(404).json({ message: 'Marca no encontrada' });
      }
      res.status(200).json({ message: `Marca ${estado} con éxito`, marca });
    } catch (error) {
      res.status(500).json({ message: 'Error al cambiar el estado de la marca', error: error.message });
    }
  }
};

export default marcaController;