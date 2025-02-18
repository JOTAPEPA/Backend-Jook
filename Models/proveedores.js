import mongoose from "mongoose";

const ProveedorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contact: {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: true }
    },
    address: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    estado: { type: String, required: true,   enum: ['activo', 'inactivo'], default: 'activo' }
});

export default mongoose.model("Proveedor", ProveedorSchema);