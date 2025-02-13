import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const app= express();
dotenv.config();

app.listen(process.env.PORT,()=>{
    console.log("Escuchando en el puerto"+ process.env.PORT);
    mongoose.connect(process.env.CNX_MONGO)
    .then(()=>console.log("conected!"))
    .catch((error)=>console.log(error))
})