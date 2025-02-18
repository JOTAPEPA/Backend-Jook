import mongoose from "mongoose";

// Esquema de usuario
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ["cliente", "vendedor", "admin"], required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    estado: { type: String, required: true,   enum: ['activo', 'inactivo'], default: 'activo' }
});

export default mongoose.model("Usuario", userSchema);