import Producto from "../Models/productos.js";
import Categoria from "../Models/categoria.js";

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
    const { search, marca, precioMin, precioMax, sortBy, tipo } = req.query;
    const safeSearch = String(search || '');
    let query = {};

    if (search) {
        query.$or = [
            { nombre: { $regex: safeSearch, $options: 'i' } },
            { descripcion: { $regex: safeSearch, $options: 'i' } },
            { marca: { $regex: safeSearch, '$options': 'i' } }, // Corregido: tipo a marca para evitar conflicto en caso de que 'marca' también sea un campo search
            { tipo: { $regex: safeSearch, '$options': 'i' } },
        ];
    }

    const categoriaId = req.query.categoria || req.query.categoryId;

    if (categoriaId) {
        try {
            if (/^[a-fA-F0-9]{24}$/.test(categoriaId)) {
                // Si parece un ObjectId, úsalo directamente para el campo categoryId en la query
                query.categoryId = categoriaId; // <-- ¡CAMBIO APLICADO AQUÍ!
            } else {
                // Si no parece un ObjectId, busca la categoría por nombre y luego usa su _id
                const categoriaObj = await Categoria.findOne({ name: categoriaId });
                if (categoriaObj) {
                    query.categoryId = categoriaObj._id; // <-- ¡CAMBIO APLICADO AQUÍ!
                } else {
                    return res.status(404).json({ message: `Categoría '${categoriaId}' no encontrada.` });
                }
            }
        } catch (catError) {
            console.error("Error al buscar categoría:", catError);
            return res.status(500).json({ message: "Error interno al procesar la categoría." });
        }
    }

    if (marca) query.marca = { $regex: marca, $options: 'i' };
    if (tipo) query.tipo = { $regex: tipo, '$options': 'i' }; // Corregido: Añadido '$options': 'i' para consistencia

    if (precioMin || precioMax) {
        query.price = {};
        if (precioMin) query.price.$gte = parseFloat(precioMin);
        if (precioMax) query.price.$lte = parseFloat(precioMax);
    }

    let sortOptions = {};
    if (sortBy) {
        if (sortBy === 'Precio: Menor a Mayor') sortOptions.price = 1;
        else if (sortBy === 'Precio: Mayor a Menor') sortOptions.price = -1;
    }

    try {
        console.log("Query final:", query);
        // Usamos populate para traer la información completa de la categoría si es necesario para el frontend
        const productos = await Producto.find(query).sort(sortOptions).populate('categoryId');

        const sugerenciasMarca = search
            ? await Producto.aggregate([
                { $match: { marca: { $regex: safeSearch, $options: 'i', $ne: null } } },
                { $group: { _id: "$marca" } },
                { $limit: 5 }
            ])
            : [];

        const sugerenciasCategoria = search
            ? await Categoria.find({
                name: { $regex: safeSearch, $options: 'i' }
            }).limit(5)
            : [];

        res.json({
            productos,
            sugerenciasMarca: sugerenciasMarca.map(m => m._id),
            sugerenciasCategoria
        });

    } catch (error) {
        console.error("Error completo:", error);
        res.status(500).json({ error: "Error al realizar la búsqueda de productos" });
    }
},


  // Opcional: Función para obtener todos los tipos de uso para poblar el frontend
  getTodosLosTiposDeUso: async (req, res) => {
    try {
      console.log("Intentando obtener tipos de uso (desde campo 'tipo')...");
      const tiposDeUso = await Producto.distinct('tipo'); 
      console.log("Tipos de uso obtenidos:", tiposDeUso);
      res.json(tiposDeUso);
    } catch (error) {
      console.error('Error al obtener tipos de uso:', error);
      res.status(500).json({ msg: 'Error del servidor al obtener tipos de uso' });
    }
  },


  // Obtener todos los productos (se puede modificar para filtrar por marca)
  getProductos: async (req, res) => {
    try {
      const { marca } = req.query; // Obtener el parámetro de marca de la URL
      let query = {};

      if (marca) {
        query.marca = { $regex: marca, $options: 'i' }; // Filtrar por marca (insensible a mayúsculas/minúsculas)
      }

      const productos = await Producto.find(query).populate("categoryId");
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },


  getTodasLasMarcas: async (req, res) => {
    try {
      // Obtenemos solo el campo 'marca' de todos los productos para mayor eficiencia
      const productos = await Producto.find({}, 'marca');
      // Extraemos las marcas únicas y filtramos valores nulos/vacíos
      const marcasUnicas = [...new Set(productos.map(p => p.marca).filter(Boolean))];
      res.json(marcasUnicas); // Esto devolverá un array de strings (nombres de marcas)
    } catch (error) {
      console.error('Error al obtener todas las marcas:', error);
      res.status(500).json({ message: 'Error interno del servidor al obtener marcas.' });
    }
  },


  // Nuevo controlador para obtener productos por marca específica
  getProductosPorMarca: async (req, res) => {
    try {
      const { marca } = req.params; // Obtener la marca de los parámetros de la URL
      if (!marca) {
        return res.status(400).json({ message: "Se requiere un nombre de marca para filtrar" });
      }
      const productos = await Producto.find({ marca: { $regex: marca, $options: 'i' } }).populate("categoryId");
      if (!productos || productos.length === 0) {
        return res.status(404).json({ message: `No se encontraron productos para la marca "${marca}"` });
      }
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos por marca:", error);
      res.status(500).json({ error: "Error al obtener productos por marca" });
    }
  },

  // Obtener un producto por ID
  getProductoById: async (req, res) => {
    try {
      const { id } = req.params;
      const producto = await Producto.findById(id)
        .populate("categoryId")
        .populate({
          path: 'reviews',
          populate: {
            path: 'user',
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
        const { nombre, descripcion, price, categoryId, stock, marca, tipo, } = req.body;
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