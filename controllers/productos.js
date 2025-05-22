import Producto from "../Models/productos.js";
import multer from "multer";
import fs from "fs";
import cloudinary from "../utils/cloudinary.js";

// Configuración de Multer para guardar las imágenes temporalmente
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage }).array('images', 4); // hasta 4 imágenes

const productosController = {
  // Crear producto
  createProducto: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) return res.status(500).json({ error: err.message });

      try {
        const { nombre, descripcion, price, categoryId, stock, marca, tipo, } = req.body;
        const files = req.files;

        const imageUrls = [];

        for (const file of files) {
          const result = await cloudinary.uploader.upload(file.path, { folder: 'productos' });
          imageUrls.push(result.secure_url);
          fs.unlinkSync(file.path);
        }

        const producto = new Producto({
          nombre,
          descripcion,
          price,
          categoryId,
          stock,
          marca,
          tipo,
          images: imageUrls,
        });

        await producto.save();
        res.status(201).json({ message: "Producto creado exitosamente", producto });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  },


  buscarProductos: async (req, res) => {
    const { query } = req.query;
  
    if (!query) {
      return res.status(400).json({ message: "Se requiere un término de búsqueda" });
    }
  
    try {
      const results = await Producto.find({
        $or: [
          { nombre: { $regex: query, $options: 'i' } },
          { descripcion: { $regex: query, $options: 'i' } },
          { marca: { $regex: query, $options: 'i' } },
          { tipo: { $regex: query, $options: 'i' } },
          { subtipo: { $regex: query, $options: 'i' } },
        ],
      }).populate("categoryId");
  
      if (results.length === 0) {
        return res.status(404).json({ message: "No se encontraron productos para el término buscado" });
      }
  
      res.json(results);
    } catch (error) {
      console.error("Error al buscar productos:", error);
      res.status(500).json({ error: "Error al realizar la búsqueda de productos" });
    }
  },

  // Obtener todos los productos
  getProductos: async (req, res) => {
    try {
      const productos = await Producto.find().populate("categoryId");
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  
  // Obtener un producto por ID
  getProductoById: async (req, res) => {
    try {
      const { id } = req.params;
      const producto = await Producto.findById(id)
        .populate("categoryId") // Esto ya lo tienes y funciona para la categoría
        .populate({
          path: 'reviews',
          populate: {
            path: 'user',
            select: 'name',
            select: 'name profilePic' 
          }
        });

      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      res.json(producto);
    } catch (error) {
      console.error("Error al obtener el producto:", error);
      res.status(500).json({ error: error.message });
    }
  },
  // Actualizar producto
  updateProducto: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) return res.status(500).json({ error: err.message });

      try {
        const { nombre, descripcion, price, categoryId, stock, marca, tipo,  } = req.body;
        const files = req.files;
        const imageUrls = [];

        if (files && files.length > 0) {
          for (const file of files) {
            const result = await cloudinary.uploader.upload(file.path, { folder: 'productos' });
            imageUrls.push(result.secure_url);
            fs.unlinkSync(file.path);
          }
        }

        const updateData = {
          nombre,
          descripcion,
          price,
          categoryId,
          stock,
          marca,
          tipo,
          updatedAt: Date.now(),
        };

        if (imageUrls.length > 0) {
          updateData.images = imageUrls;
        }

        const updatedProducto = await Producto.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true }
        );

        if (!updatedProducto) {
          return res.status(404).json({ message: "Producto no encontrado" });
        }

        res.status(200).json({ message: "Producto actualizado", producto: updatedProducto });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  },

  // Activar producto
  activarProducto: async (req, res) => {
    try {
      const { id } = req.params;
      const producto = await Producto.findByIdAndUpdate(id, { estado: 'activo' }, { new: true });
      if (!producto) return res.status(404).json({ message: "Producto no encontrado" });
      res.status(200).json({ message: "Producto activado correctamente", producto });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Inactivar producto
  inactivarProducto: async (req, res) => {
    try {
      const { id } = req.params;
      const producto = await Producto.findByIdAndUpdate(id, { estado: 'inactivo' }, { new: true });
      if (!producto) return res.status(404).json({ message: "Producto no encontrado" });
      res.status(200).json({ message: "Producto inactivado correctamente", producto });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Agregar reseña a un producto
  agregarReseña: async (req, res) => {
    console.log('*** Llegó a agregarReseña ***');
    console.log('req.params.id:', req.params.id);
    console.log('req.body:', req.body);
    const { id } = req.params; // ID del producto
    const { comment, rating } = req.body;
    const userId = req.usuario._id;
    const userName = req.usuario.name;
  
    try {
      const producto = await Producto.findById(id);
      if (!producto) return res.status(404).json({ message: "Producto no encontrado" });
  
      const nuevaReseña = {
        user: userId,
        name: userName, // Usando userName directamente del req.usuario
        comment,
        rating,
      };
  
      producto.reviews.push(nuevaReseña);
      await producto.save();
  
      res.status(201).json({ message: "Reseña agregada", review: nuevaReseña });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Eliminar una reseña de un producto
  eliminarReseña: async (req, res) => {
    const { id: productId, reviewId } = req.params; // ID del producto y de la reseña
    const userId = req.usuario._id;

    try {
      const producto = await Producto.findById(productId);
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      // Encontrar la reseña que coincide con el ID y el usuario
      const reviewIndex = producto.reviews.findIndex(
        (review) => review._id.toString() === reviewId && review.user.toString() === userId.toString()
      );

      if (reviewIndex === -1) {
        return res.status(404).json({ message: "Reseña no encontrada o no pertenece al usuario" });
      }

      // Eliminar la reseña del array
      producto.reviews.splice(reviewIndex, 1);
      await producto.save();

      res.status(200).json({ message: "Reseña eliminada exitosamente" });
    } catch (error) {
      console.error("Error al eliminar la reseña:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener productos por categoría
  getProductosPorCategoria: async (req, res) => {
    const { categoriaId } = req.params; // Obtiene el ID de la categoría de los parámetros de la URL
    console.log("categoriaId recibido:", categoriaId); // Añade este log
    try {
      const productos = await Producto.find({ categoryId: categoriaId }).populate("categoryId");
      console.log("Productos encontrados:", productos); // Añade este log
      if (!productos || productos.length === 0) {
        return res.status(404).json({ message: "No se encontraron productos para esta categoría" });
      }
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos por categoría:", error);
      res.status(500).json({ error: "Error al obtener productos por categoría" });
    }
  },

  
};

export default productosController;
