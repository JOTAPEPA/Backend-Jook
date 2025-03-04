import Producto from "../Models/productos.js";

const productosController = {
  // Crear un nuevo producto
  createProducto: async (req, res) => {
    try {
      const producto = new Producto(req.body);
      await producto.save();
      res.status(201).json({ message: "Producto creado exitosamente", producto });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
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
