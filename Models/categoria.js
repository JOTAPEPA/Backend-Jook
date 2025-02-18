import mongoose from "mongoose";

const categoriaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    estado: { type: String, required: true,   enum: ['activo', 'inactivo'], default: 'activo' }
});

export default mongoose.model("Categoria", categoriaSchema); 