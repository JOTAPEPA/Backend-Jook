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
    // Crear un nuevo producto con subida a Cloudinary
    createProducto: async (req, res) => {
      upload(req, res, async (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        try {
          const { nombre, descripcion, price, categoryId, stock } = req.body;
          const files = req.files;

          // Subir imágenes a Cloudinary y guardar URLs
          const imageUrls = [];

          for (const file of files) {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: 'productos', // Opcional: carpeta en Cloudinary
            });

            imageUrls.push(result.secure_url);
            fs.unlinkSync(file.path); // eliminar archivo temporal
          }

          const producto = new Producto({
            nombre,
            descripcion,
            price,
            categoryId,
            stock,
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
    const productos = await Producto.find().populate("categoryId"); // Solo categoryId
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
},

// Obtener un producto por ID
getProductoById: async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await Producto.findById(id).populate("categoryId"); // Solo categoryId
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
},


updateProducto: async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    try {
      const { nombre, descripcion, price, categoryId, stock } = req.body;
      const files = req.files;
      const imageUrls = [];

      // Subir nuevas imágenes a Cloudinary si las hay
      if (files && files.length > 0) {
        for (const file of files) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'productos',
          });

          imageUrls.push(result.secure_url);
          fs.unlinkSync(file.path); // eliminar archivo temporal
        }
      }

      const updateData = {
        nombre,
        descripcion,
        price,
        categoryId,
        stock,
        updatedAt: Date.now(),
      };

      // Si hay nuevas imágenes, actualiza el campo; si no, no lo toques
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

activarProducto: async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByIdAndUpdate(
      id,
      { estado: 'activo' },
      { new: true }
    );

    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.status(200).json({ message: "Producto activado correctamente", producto });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
},

inactivarProducto: async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByIdAndUpdate(
      id,
      { estado: 'inactivo' },
      { new: true }
    );

    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.status(200).json({ message: "Producto inactivado correctamente", producto });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}



  };

  export default productosController;
