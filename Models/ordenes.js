import mongoose from 'mongoose';

const ordenesSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    paypalOrderId: { type: String, unique: true }, // ID de la orden generada por PayPal
    amount: { type: Number, required: true }, // Monto total de la orden (ya en USD, como viene del frontend)
    currency: { type: String, default: 'USD' }, // Moneda de la transacción PayPal
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referencia al usuario registrado

    // Información de los productos en la orden
    productos: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'productos', required: true },
        cantidad: { type: Number, required: true },
        precio: { type: Number, required: true }, // Precio unitario original (en COP, si así lo manejas internamente)
    }],

    total: { type: Number, required: true }, // Total final de la orden (en USD, incluyendo envío)
    estado: { type: Number, default: 1 }, // 1: Pendiente, 2: Pagado, 3: Reembolsado/Cancelado

    // --- NUEVOS CAMPOS CONSOLIDADOS PARA LA INFORMACIÓN DEL CLIENTE Y ENVÍO ---
    customerInfo: { // Detalles del cliente del formulario
        nombre: { type: String, required: true },
        apellidos: { type: String, required: true },
        email: { type: String, required: true },
        confirmarEmail: { type: String }, // Puede ser útil para validación, pero no indispensable en DB
        aceptaPrivacidad: { type: Boolean },
        aceptaTerminos: { type: Boolean },
        dni: { type: String },
        direccion: { type: String, required: true },
        pais: { type: String, required: true },
        codigoPostal: { type: String },
        provincia: { type: String, required: true },
        ciudad: { type: String, required: true },
        telefonoMovil: { type: String, required: true },
        envio: { type: String }, // 'rapido' o 'estandar'
        pago: { type: String }, // 'tarjeta' o 'paypal'
        mismaDireccion: { type: Boolean },
        empresa: { type: String },
        direccionFacturacion: { type: String },
    },
    // --- Fin de customerInfo ---

    // Detalles del pagador de PayPal (se actualiza en captureOrder)
    payerInfo: { type: Object },

    // Respuesta completa de PayPal (se actualiza en captureOrder)
    paypalResponse: { type: Object },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now } // Para registrar la última actualización
});

// Middleware para actualizar 'updatedAt'
ordenesSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

ordenesSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});


export default mongoose.model("ordenes", ordenesSchema);