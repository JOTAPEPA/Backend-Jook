import mongoose from "mongoose";

const productoSchema = new mongoose.Schema({
    id: {type: Number, required: true},
})