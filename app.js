import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import categoria from './routes/categoria';
import inventario from './routes/inventario';
import ordenes from './routes/ordenes';
import productos from './routes/productos';
import usuarios from './routes/usuarios';

dotenv.config();
const app= express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("api/categoria",categoria);
app.use("api/inventario",inventario);
app.use("api/ordenes",ordenes);
app.use("api/productos",productos);
app.use("api/usuarios",usuarios);

// 🔹 Solución a la advertencia de `strictQuery`
mongoose.set('strictQuery', false);

mongoose.connect(process.env.CNX_MONGO)
  .then(() => {
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  })
  .catch((error) => console.log('Error de conexión a MongoDB:', error))
