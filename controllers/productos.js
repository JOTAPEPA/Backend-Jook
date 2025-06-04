import Producto from "../Models/productos.js";
import Categoria from "../Models/categoria.js";
import Marca from "../Models/marca.js"; // Suponiendo que tienes un modelo para Marca
import Tipo from "../Models/tipo.js"; // Suponiendo que tienes un modelo para Tipo
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
    try {
      const { nombre, descripcion, price, categoryId, stock, marca, tipo } = req.body;
      // req.files es un objeto porque usas fields()
      // Ejemplo: req.files.images es un array con hasta 4 archivos
      // req.files.marcaImagen es un array con hasta 1 archivo
  
      const files = req.files.images || [];
      const imageUrls = [];
  
      for (const file of files) {
        const result = await cloudinary.uploader.upload(file.path, { folder: 'productos' });
        imageUrls.push(result.secure_url);
        fs.unlinkSync(file.path);
      }
  
      // Si quieres manejar también marcaImagen, haz lo mismo aquí
  
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
  },
                                                                                                               

  buscarProductos: async (req, res) => {
    const { search, marca, precioMin, precioMax, sortBy, tipo } = req.query;
    const safeSearch = String(search || '');
    let query = {};

    if (search) {
      query.$or = [
        { nombre: { $regex: safeSearch, $options: 'i' } },
        { descripcion: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const categoriaId = req.query.categoria || req.query.categoryId;

    if (categoriaId) {
      try {
        if (mongoose.Types.ObjectId.isValid(categoriaId)) { // Usar mongoose.Types.ObjectId.isValid
          query.categoryId = categoriaId;
        } else {
          const categoriaObj = await Categoria.findOne({ name: categoriaId });
          if (categoriaObj) {
            query.categoryId = categoriaObj._id;
          } else {
            return res.status(404).json({ message: `Categoría '${categoriaId}' no encontrada.` });
          }
        }
      } catch (catError) {
        console.error("Error al buscar categoría:", catError);
        return res.status(500).json({ message: "Error interno al procesar la categoría." });
      }
    }

    // --- CAMBIOS PARA MARCA Y TIPO ---
    if (marca) {
      try {
        if (mongoose.Types.ObjectId.isValid(marca)) {
          query.marca = marca;
        } else {
          const marcaObj = await Marca.findOne({ name: marca }); // Asume que el modelo Marca tiene un campo 'name'
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

    if (tipo) {
      try {
        if (mongoose.Types.ObjectId.isValid(tipo)) {
          query.tipo = tipo;
        } else {
          const tipoObj = await Tipo.findOne({ name: tipo }); // Asume que el modelo Tipo tiene un campo 'name'
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
    // --- FIN CAMBIOS PARA MARCA Y TIPO ---

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
      // Usamos populate para traer la información completa de la categoría, marca y tipo
      const productos = await Producto.find(query)
        .sort(sortOptions)
        .populate('categoryId')
        .populate('marca') // Popula la referencia a Marca
        .populate('tipo'); // Popula la referencia a Tipo

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
        sugerenciasMarca: sugerenciasMarca.map(m => m.name), // Devuelve el nombre de la marca
        sugerenciasCategoria,
        sugerenciasTipo: sugerenciasTipo.map(t => t.name) // Devuelve el nombre del tipo
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
      // Ahora se recomienda obtener los nombres de los tipos directamente de la colección Tipo
      const tiposDeUso = await Tipo.find({}, 'name'); // Obtiene solo el campo 'name'
      console.log("Tipos de uso obtenidos:", tiposDeUso);
      res.json(tiposDeUso.map(t => t.name)); // Devuelve solo los nombres
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
        // Asumiendo que marca puede ser un ObjectId o un nombre
        if (mongoose.Types.ObjectId.isValid(marca)) {
          query.marca = marca;
        } else {
          const marcaObj = await Marca.findOne({ name: marca });
          if (marcaObj) {
            query.marca = marcaObj._id;
          } else {
            return res.status(404).json({ message: `Marca '${marca}' no encontrada.` });
          }
        }
      }

      const productos = await Producto.find(query)
        .populate("categoryId")
        .populate("marca")
        .populate("tipo");
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getTodasLasMarcas: async (req, res) => {
    try {
      // Obtenemos solo el campo 'name' de la colección Marca
      const marcas = await Marca.find({}, 'name');
      res.json(marcas.map(m => m.name)); // Esto devolverá un array de strings (nombres de marcas)
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

      let marcaId;
      if (mongoose.Types.ObjectId.isValid(marca)) {
        marcaId = marca;
      } else {
        const marcaObj = await Marca.findOne({ name: { $regex: marca, $options: 'i' } });
        if (marcaObj) {
          marcaId = marcaObj._id;
        } else {
          return res.status(404).json({ message: `Marca "${marca}" no encontrada.` });
        }
      }

      const productos = await Producto.find({ marca: marcaId })
        .populate("categoryId")
        .populate("marca")
        .populate("tipo");

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
        .populate("marca") // Popula la referencia a Marca
        .populate("tipo") // Popula la referencia a Tipo
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
    try {
      const { nombre, descripcion, price, categoryId, stock, marca, tipo } = req.body;
      const files = req.files; // multer ya llenó esto gracias al middleware en la ruta
  
      const imageUrls = [];
  
      // files es un objeto con keys según los campos, ej: { images: [...], marcaImagen: [...] }
      // Debes manejar cada campo por separado:
      
      if (files) {
        // Ejemplo para imágenes del producto
        if (files.images) {
          for (const file of files.images) {
            const result = await cloudinary.uploader.upload(file.path, { folder: 'productos' });
            imageUrls.push(result.secure_url);
            fs.unlinkSync(file.path);
          }
        }
  
        // Ejemplo para imagen de marca (si la manejas también)
        if (files.marcaImagen) {
          // Si quieres subir esta imagen a cloudinary o manejarla, hazlo aquí
          // Por ejemplo:
          // const marcaImgResult = await cloudinary.uploader.upload(files.marcaImagen[0].path, { folder: 'marcaImagenes' });
          // fs.unlinkSync(files.marcaImagen[0].path);
          // Guardar URL en updateData si es necesario
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
      )
        .populate("categoryId")
        .populate("marca")
        .populate("tipo");
  
      if (!updatedProducto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
  
      res.status(200).json({ message: "Producto actualizado", producto: updatedProducto });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  

  // Activar producto
  activarProducto: async (req, res) => {
    try {
      const { id } = req.params;
      const producto = await Producto.findByIdAndUpdate(id, { estado: 'activo' }, { new: true })
        .populate("categoryId")
        .populate("marca")
        .populate("tipo");
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
      const producto = await Producto.findByIdAndUpdate(id, { estado: 'inactivo' }, { new: true })
        .populate("categoryId")
        .populate("marca")
        .populate("tipo");
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
      const productos = await Producto.find({ categoryId: categoriaId })
        .populate("categoryId")
        .populate("marca")
        .populate("tipo");
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

  // ... (tu código existente del controlador)

// Agrega esta nueva función al objeto productosController
changeProductoEstado: async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // ← ahora viene del body

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


// ... (el resto de tu código del controlador)
};

export default productosController;