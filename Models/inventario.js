import mongoose from 'mongoose';

const inventarioSchema = new mongoose.Schema({
    productos:{type:mongoose.Schema.Types.ObjectId,ref:'productos',required:true, },
    tipo: { type: Number, default: 1}, //1 entrada, 0 salida
    cantidad: { type: Number, required: true },
    fecha : { type: Date, default: Date.now },
    usuarios: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
    reason : { type: String, required: true },

})

export default mongoose.model('inventario', inventarioSchema);  