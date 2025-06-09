import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from "cors";

import categoria from './routes/categoria.js';
import inventario from './routes/inventario.js';
import ordenes from './routes/ordenes.js';
import productos from './routes/productos.js';
import marca from './routes/marca.js';
import tipo from './routes/tipo.js';
import usuarios from './routes/usuarios.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { initPayPalClient } from './utils/paypalClient.js';


// 1️⃣ Cargar variables de entorno
dotenv.config();

const comodin = "nada"
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/payments/webhook', express.raw({ type: 'application/json' })); // Webhook necesita raw
app.use(express.static("Public"))


app.use("/api/categoria", categoria);
app.use("/api/inventario", inventario);
app.use("/api/ordenes", ordenes);
app.use("/api/producto", productos);
app.use("/api/marca", marca);
app.use("/api/tipo", tipo)
app.use("/api/usuario", usuarios);

app.use('/api/payments', paymentRoutes);


mongoose.set('strictQuery', false);

mongoose.connect(process.env.CNX_MONGO)
  .then(() => {
    console.log('✅ Conectado a MongoDB');

    initPayPalClient();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
    });
  })
  .catch((error) => console.log('❌ Error de conexión a MongoDB:', error));