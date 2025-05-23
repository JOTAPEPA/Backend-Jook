import mongoose from "mongoose";

// Esquema de usuario
const userSchema = new mongoose.Schema({
    name: { type: String,  },
    email: { type: String, unique: true },
    role: { type: String, enum: ["cliente", "vendedor", "admin"],  },
    password: { type: String,  },
    profilePic: { type: String }, 
    favoritos: [{ type: mongoose.Schema.Types.ObjectId, ref: "productos" }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    estado: { type: String,  enum: ['activo', 'inactivo'], default: 'activo' }
});

export default mongoose.model("Usuario", userSchema);