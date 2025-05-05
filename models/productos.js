import mongoose from "mongoose";

const productoSchema = new mongoose.Schema({
    nombre: {type: String, required: true},
    descripcion: {type: String, required: true},
    price: {type: Number, required: true},
    categoryId:{type: mongoose.Schema.Types.ObjectId, ref: 'categoria'},
    stock: {type: Number, required: true},
    images: [String], 
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
})

export default mongoose.model("productos", productoSchema);
   