import mongoose from 'mongoose';

const marcaSchema = new mongoose.Schema({
  nombre: {type: String, required: true,unique: true,trim: true },
  imagen: { type: String },
  estado: {type: String,enum: ['activo', 'inactivo'],default: 'activo'}
}, { timestamps: true }); 

export default mongoose.model('Marca', marcaSchema);