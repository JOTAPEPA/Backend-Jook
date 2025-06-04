import mongoose from 'mongoose';

const tipoSchema = new mongoose.Schema({
    nombre: { type: String,},
    estado: {type: String,enum: ['activo', 'inactivo'],default: 'activo' }
}, { timestamps: true });

export default  mongoose.model('Tipo', tipoSchema);