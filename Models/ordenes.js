import mongoose from 'mongoose';

const ordenesSchema = new mongoose.Schema({
usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'usuarios', required: true },
productos: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'productos', required: true },
    cantidad: { type: Number, required: true },
    precio: { type: Number, required: true },
}],
total: { type: Number, required: true },
estado: {type: Number, default: 1}, //1 pendiente, 2 pagado, 3 cancelado
createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('ordenes', ordenesSchema);