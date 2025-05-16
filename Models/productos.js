import mongoose from "mongoose";

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  images: [String],
  estado: { type: String, enum: ['activo', 'inactivo'], default: 'activo' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // Relaciones y clasificación
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' },

  // Nuevos campos jerárquicos
  marca: { type: String, required: true },      // Ej: Samsung
  tipo: { type: String, required: true },       // Ej: Electrónicos
});

export default mongoose.model("productos", productoSchema);
