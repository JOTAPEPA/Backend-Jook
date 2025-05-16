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
      const producto = await Producto.findById(id).populate("categoryId");
      if (!producto) return res.status(404).json({ message: "Producto no encontrado" });
      res.json(producto);
    } catch (error) {
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

  // 🔍 Nuevo: Filtrar productos por marca, tipo, estado, etc.
  filtrarProductos: async (req, res) => {
    try {
      const { marca, tipo,  estado, categoryId } = req.query;

      const filtro = {};

      if (marca) filtro.marca = marca;
      if (tipo) filtro.tipo = tipo;
      if (estado) filtro.estado = estado;
      if (categoryId) filtro.categoryId = categoryId;

      const productos = await Producto.find(filtro).populate("categoryId");

      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export default productosController;
