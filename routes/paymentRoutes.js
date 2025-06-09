import express from 'express';
import {
  createOrder,
  captureOrder,
  handleWebhook
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create-order', createOrder);
router.post('/capture-order', captureOrder);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
