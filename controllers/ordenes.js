import Orden from "../Models/ordenes.js";

const ordenesController = {
  // Crear una nueva orden
  createOrden: async (req, res) => {
    try {
      const orden = new Orden(req.body);
      await orden.save();
      res.status(201).json({ message: "Orden creada exitosamente", orden });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener todas las órdenes
  getOrdenes: async (req, res) => {
    try {
      const ordenes = await Orden.find().populate("usuarioId productos.productId");
      res.json(ordenes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener una orden por ID
  getOrdenById: async (req, res) => {
    try {
      const { id } = req.params;
      const orden = await Orden.findById(id).populate("usuarioId productos.productId");
      if (!orden) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }
      res.json(orden);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getOrdersByUser: async (req, res) => {
    try {
      const userId = req.params.userId; // Captura el ID del usuario de la URL
      // Busca órdenes donde 'usuarioId' coincide con el ID proporcionado
      const orders = await Orden.find({ usuarioId: userId })
        .populate({
          path: 'productos.productId', // Esto es CLAVE para obtener los detalles del producto
          select: 'nombre imagen' // Solo trae 'nombre' e 'imagen' del producto
        })
        .sort({ createdAt: -1 }); // Opcional: ordenar por las más recientes primero

      if (!orders || orders.length === 0) {
        // Devuelve 200 OK con un arreglo vacío si no hay órdenes, o 404 si prefieres.
        // Un 200 con array vacío es más común para "no hay resultados".
        return res.status(200).json([]);
      }

      res.status(200).json(orders);
    } catch (error) {
      console.error('Error al obtener órdenes del usuario:', error);
      res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
  },

  // Editar una orden
  updateOrden: async (req, res) => {
    try {
      const { productos, total, estado } = req.body;
      const updatedOrden = await Orden.findByIdAndUpdate(
        req.params.id,
        { productos, total, estado },
        { new: true }
      ).populate("usuarioId productos.productId");
      if (!updatedOrden) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }
      res.status(200).json({ message: "Orden actualizada", orden: updatedOrden });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default ordenesController;
