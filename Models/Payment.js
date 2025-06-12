import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  paypalOrderId: { type: String, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['created', 'approved', 'completed', 'failed', 'refunded'], default: 'created' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: String, required: true },
    name: String,
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  shippingAddress: Object,
  payerInfo: Object,
  paypalResponse: Object
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
