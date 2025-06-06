import mongoose from 'mongoose';
import Producto from "../Models/productos.js";
import Categoria from "../Models/categoria.js";
import Marca from "../Models/marca.js"; // Importa el modelo Marca
import Tipo from "../Models/tipo.js";
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

// Este 'upload' es para la creación/actualización de productos (hasta 4 imágenes)
const upload = multer({ storage }).array('images', 4);

const productosController = {
  // Crear producto
  createProducto: async (req, res) => {
    try {
      const { nombre, descripcion, price, categoryId, stock, marca, tipo } = req.body;

      const files = req.files || []; // Asegúrate de que req.files exista
      const imageUrls = [];

      // Si hay archivos para subir
      if (files.length > 0) {
        for (const file of files) {
          const result = await cloudinary.uploader.upload(file.path, { folder: 'productos' });
          imageUrls.push(result.secure_url);
          fs.unlinkSync(file.path); // Eliminar el archivo temporal
        }
      }

      const producto = new Producto({
        nombre,
        descripcion,
        price,
        categoryId,
        stock,
        marca, // Asegúrate de que este 'marca' sea un ID de Marca
        tipo,  // Asegúrate de que este 'tipo' sea un ID de Tipo
        images: imageUrls,
      });

      await producto.save();
      res.status(201).json({ message: "Producto creado exitosamente", producto });
    } catch (error) {
      console.error("Error al crear producto:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener todos los productos (con posible filtro por marca en query)
  getProductos: async (req, res) => {
    try {
      const { marca } = req.query;
      let query = {};

      if (marca) {
        // Permitir filtrar por ID o nombre de marca en la query string
        if (mongoose.Types.ObjectId.isValid(marca)) {
          query.marca = marca;
        } else {
          const marcaObj = await Marca.findOne({ name: { $regex: marca, $options: 'i' } }); // Búsqueda por nombre
          if (marcaObj) {
            query.marca = marcaObj._id;
          } else {
            return res.status(404).json({ message: `Marca '${marca}' no encontrada para el filtro.` });
          }
        }
      }

      const productos = await Producto.find(query)
        .populate("categoryId")
        .populate("marca")
        .populate("tipo");
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Buscar productos con filtros avanzados
  buscarProductos: async (req, res) => {
    const { search, marca, precioMin, precioMax, sortBy, tipo, categoria } = req.query; // Añadido 'categoria' para ser explícito
    const safeSearch = String(search || '');
    let query = {};

    if (search) {
      query.$or = [
        { nombre: { $regex: safeSearch, $options: 'i' } },
        { descripcion: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    // Filtro por categoría (puede venir como 'categoria' o 'categoryId')
    const categoriaIdParam = categoria || req.query.categoryId;
    if (categoriaIdParam) {
      try {
        if (mongoose.Types.ObjectId.isValid(categoriaIdParam)) {
          query.categoryId = categoriaIdParam;
        } else {
          const categoriaObj = await Categoria.findOne({ name: { $regex: categoriaIdParam, $options: 'i' } });
          if (categoriaObj) {
            query.categoryId = categoriaObj._id;
          } else {
            return res.status(404).json({ message: `Categoría '${categoriaIdParam}' no encontrada.` });
          }
        }
      } catch (catError) {
        console.error("Error al buscar categoría:", catError);
        return res.status(500).json({ message: "Error interno al procesar la categoría." });
      }
    }

    // Filtro por marca
    if (marca) {
      try {
        if (mongoose.Types.ObjectId.isValid(marca)) {
          query.marca = marca;
        } else {
          const marcaObj = await Marca.findOne({ name: { $regex: marca, $options: 'i' } });
          if (marcaObj) {
            query.marca = marcaObj._id;
          } else {
            return res.status(404).json({ message: `Marca '${marca}' no encontrada.` });
          }
        }
      } catch (marcaError) {
        console.error("Error al buscar marca:", marcaError);
        return res.status(500).json({ message: "Error interno al procesar la marca." });
      }
    }

    // Filtro por tipo de uso
    if (tipo) {
      try {
        if (mongoose.Types.ObjectId.isValid(tipo)) {
          query.tipo = tipo;
        } else {
          const tipoObj = await Tipo.findOne({ name: { $regex: tipo, $options: 'i' } });
          if (tipoObj) {
            query.tipo = tipoObj._id;
          } else {
            return res.status(404).json({ message: `Tipo '${tipo}' no encontrado.` });
          }
        }
      } catch (tipoError) {
        console.error("Error al buscar tipo:", tipoError);
        return res.status(500).json({ message: "Error interno al procesar el tipo." });
      }
    }

    // Filtro por rango de precios
    if (precioMin || precioMax) {
      query.price = {};
      if (precioMin) query.price.$gte = parseFloat(precioMin);
      if (precioMax) query.price.$lte = parseFloat(precioMax);
    }

    // Opciones de ordenamiento
    let sortOptions = {};
    if (sortBy) {
      if (sortBy === 'Precio: Menor a Mayor') sortOptions.price = 1;
      else if (sortBy === 'Precio: Mayor a Menor') sortOptions.price = -1;
    }

    try {
      console.log("Query final (buscarProductos):", query);
      const productos = await Producto.find(query)
        .sort(sortOptions)
        .populate('categoryId')
        .populate('marca')
        .populate('tipo');

      // Sugerencias (útiles para autocompletar)
      const sugerenciasMarca = search
        ? await Marca.find({ name: { $regex: safeSearch, $options: 'i' } }).limit(5)
        : [];
      const sugerenciasCategoria = search
        ? await Categoria.find({ name: { $regex: safeSearch, $options: 'i' } }).limit(5)
        : [];
      const sugerenciasTipo = search
        ? await Tipo.find({ name: { $regex: safeSearch, $options: 'i' } }).limit(5)
        : [];

      res.json({
        productos,
        sugerenciasMarca: sugerenciasMarca.map(m => ({ _id: m._id, name: m.name, image: m.image })),
        sugerenciasCategoria,
        sugerenciasTipo: sugerenciasTipo.map(t => ({ _id: t._id, name: t.name, image: t.image }))
      });

    } catch (error) {
      console.error("Error completo (buscarProductos):", error);
      res.status(500).json({ error: "Error al realizar la búsqueda de productos" });
    }
  },

  // Obtener un producto por ID
  getProductoById: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID de producto inválido." });
      }
      const producto = await Producto.findById(id)
        .populate("categoryId")
        .populate("marca")
        .populate("tipo")
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
      console.error("Error al obtener el producto por ID:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar producto
  updateProducto: async (req, res) => {
    try {
      const { nombre, descripcion, price, categoryId, stock, marca, tipo } = req.body;
      const files = req.files; // req.files.images para el array de imágenes

      let imageUrls = [];
      // Si hay nuevas imágenes para subir, las procesamos
      if (files && files.images && files.images.length > 0) {
        for (const file of files.images) {
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

      // Solo si se subieron nuevas imágenes, actualizamos el campo 'images'
      if (imageUrls.length > 0) {
        updateData.images = imageUrls;
      }

      const updatedProducto = await Producto.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true } // Para devolver el documento actualizado
      )
        .populate("categoryId")
        .populate("marca")
        .populate("tipo");

      if (!updatedProducto) {
        return res.status(404).json({ message: "Producto no encontrado para actualizar" });
      }

      res.status(200).json({ message: "Producto actualizado", producto: updatedProducto });
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Cambiar estado de un producto (activo/inactivo)
  changeProductoEstado: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body; // Se espera 'estado' en el body

      if (!['activo', 'inactivo'].includes(estado)) {
        return res.status(400).json({ message: "Estado no válido. Debe ser 'activo' o 'inactivo'." });
      }

      const producto = await Producto.findByIdAndUpdate(id, { estado }, { new: true })
        .populate("categoryId")
        .populate("marca")
        .populate("tipo");

      if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

      res.status(200).json({ message: `Producto puesto en estado '${estado}' correctamente`, producto });
    } catch (error) {
      console.error("Error al cambiar el estado del producto:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Agregar reseña a un producto
  agregarReseña: async (req, res) => {
    const { id } = req.params; // ID del producto
    const { comment, rating } = req.body;
    const userId = req.usuario._id; // Asumiendo que ValidarJWT adjunta el usuario a req.usuario
    const userName = req.usuario.name;

    try {
      const producto = await Producto.findById(id);
      if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

      const nuevaReseña = {
        user: userId,
        name: userName,
        comment,
        rating,
      };

      producto.reviews.push(nuevaReseña);
      await producto.save();

      res.status(201).json({ message: "Reseña agregada", review: nuevaReseña });
    } catch (error) {
      console.error("Error al agregar reseña:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Eliminar una reseña de un producto
  eliminarReseña: async (req, res) => {
    const { id: productId, reviewId } = req.params; // ID del producto y ID de la reseña
    const userId = req.usuario._id;

    try {
      const producto = await Producto.findById(productId);
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      const reviewIndex = producto.reviews.findIndex(
        (review) => review._id.toString() === reviewId && review.user.toString() === userId.toString()
      );

      if (reviewIndex === -1) {
        return res.status(404).json({ message: "Reseña no encontrada o no pertenece al usuario" });
      }

      producto.reviews.splice(reviewIndex, 1); // Eliminar la reseña del array
      await producto.save();

      res.status(200).json({ message: "Reseña eliminada exitosamente" });
    } catch (error) {
      console.error("Error al eliminar la reseña:", error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener productos por categoría (usando categoryId del parámetro de ruta)
  getProductosPorCategoria: async (req, res) => {
    const { categoriaId } = req.params;
    try {
      // Validar si el ID es un ObjectId válido de Mongoose
      if (!mongoose.Types.ObjectId.isValid(categoriaId)) {
        return res.status(400).json({ message: "ID de categoría inválido." });
      }

      const productos = await Producto.find({ categoryId: categoriaId })
        .populate("categoryId")
        .populate("marca")
        .populate("tipo");

      if (!productos || productos.length === 0) {
        return res.status(200).json({ message: "No se encontraron productos para esta categoría", productos: [] });
      }
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos por categoría:", error);
      res.status(500).json({ error: "Error al obtener productos por categoría" });
    }
  },

  // -- ¡IMPORTANTE! Función para obtener LOS PRODUCTOS de una MARCA (la que usa tu VistaMarca.vue para el listado)
  getProductosDeMarcaId: async (req, res) => {
    try {
      const { id } = req.params; // El ID de la marca viene como parámetro de ruta

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID de marca inválido." });
      }

      const productos = await Producto.find({ marca: id })
        .populate("categoryId")
        .populate("marca") // Para popular el objeto de la marca
        .populate("tipo");

      if (!productos || productos.length === 0) {
        return res.status(200).json({ message: `No se encontraron productos para la marca con ID: ${id}`, productos: [] });
      }
      res.json(productos); // Devuelve la lista de productos
    } catch (error) {
      console.error("Error al obtener productos por ID de marca:", error);
      res.status(500).json({ error: "Error al obtener productos por marca" });
    }
  },

  // -- ¡IMPORTANTE! Función para obtener los DETALLES de una MARCA (la que usa tu VistaMarca.vue para el título)
  getMarcaById: async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID de marca inválido." });
      }
      const marca = await Marca.findById(id);
      if (!marca) {
        return res.status(404).json({ message: 'Marca no encontrada.' });
      }
      res.json(marca); // Devuelve el objeto COMPLETO de la marca
    } catch (error) {
      console.error('Error al obtener marca por ID (desde productosController):', error);
      res.status(500).json({ message: 'Error del servidor al obtener la marca.' });
    }
  },

  // Obtener todas las marcas
  getTodasLasMarcas: async (req, res) => {
    try {
      const marcas = await Marca.find({});
      res.json(marcas);
    } catch (error) {
      console.error('Error al obtener todas las marcas:', error);
      res.status(500).json({ message: 'Error interno del servidor al obtener marcas.' });
    }
  },

  // Obtener todos los tipos de uso
  getTodosLosTiposDeUso: async (req, res) => {
    try {
      const tiposDeUso = await Tipo.find({});
      res.json(tiposDeUso);
    } catch (error) {
      console.error('Error al obtener tipos de uso:', error);
      res.status(500).json({ msg: 'Error del servidor al obtener tipos de uso' });
    }
  },
};

export default productosController;