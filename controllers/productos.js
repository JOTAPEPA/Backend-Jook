import Producto from "../Models/productos.js";
import multer from "multer";

// Configuración de Multer para guardar las imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Ruta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Nombre único para las imágenes
  }
});

const upload = multer({ storage }).array('images', 4); // Aceptar hasta 4 imágenes

const productosController = {
  // Crear un nuevo producto
  createProducto: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      try {
        // Crear un objeto con los datos del producto y las imágenes
        const { nombre, descripcion, price, categoryId, stock } = req.body;
        const images = req.files ? req.files.map(file => file.path) : []; // Obtener las rutas de las imágenes

        const producto = new Producto({
          nombre,
          descripcion,
          price,
          categoryId,
          stock,
          images, // Guardar las rutas de las imágenes
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
      const productos = await Producto.find().populate("categoryId proveedorId usuarioId");
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener un producto por ID
  getProductoById: async (req, res) => {
    try {
      const { id } = req.params;
      const producto = await Producto.findById(id).populate("categoryId proveedorId usuarioId");
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      res.json(producto);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Editar producto
  updateProducto: async (req, res) => {
    try {
      const { nombre, descripcion, price, categoryId, proveedorId, stock, usuarioId } = req.body;
      const updatedProducto = await Producto.findByIdAndUpdate(
        req.params.id,
        { nombre, descripcion, price, categoryId, proveedorId, stock, usuarioId, updatedAt: Date.now() },
        { new: true }
      );
      if (!updatedProducto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      res.status(200).json({ message: "Producto actualizado", producto: updatedProducto });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default productosController;
