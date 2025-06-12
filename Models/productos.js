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
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' },
  marca: { type: mongoose.Schema.Types.ObjectId, ref: 'Marca' },
  tipo: { type: mongoose.Schema.Types.ObjectId, ref: 'Tipo' },

  oferta: {
    activa: { type: Boolean, default: false },
    porcentaje: { type: Number, min: 0, max: 100 },
    precioOferta: { type: Number },
    fechaInicio: { type: Date },
    fechaFin: { type: Date },
  },

  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
      name: { type: String },
      comment: { type: String, required: true },
      rating: { type: Number, min: 1, max: 5, required: true },
      createdAt: { type: Date, default: Date.now },
    }
  ]
});

export default mongoose.model("productos", productoSchema);

