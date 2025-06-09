import paypal from '@paypal/checkout-server-sdk';
import { getPayPalClient, verifyWebhookSignature } from '../utils/paypalClient.js';
import { sendConfirmationEmail } from '../utils/emailSender.js';
import ordenes from '../Models/ordenes.js';

export const createOrder = async (req, res) => {
  try {
    const { amount, items, user, orderId } = req.body;

    // Validaciones básicas
    if (!amount || !items || !user || !orderId) {
      return res.status(400).json({ error: 'Faltan datos necesarios en la solicitud' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return res.status(400).json({ error: 'El amount no es válido' });
    }

    // Convertimos precios si vienen como string
    items.forEach((item) => {
      item.price = parseFloat(item.price);
    });

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: orderId,
          amount: {
            currency_code: 'USD',
            value: parsedAmount.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: parsedAmount.toFixed(2),
              },
            },
          },
          items: items.map((item) => ({
            name: item.name,
            unit_amount: {
              currency_code: 'USD',
              value: item.price.toFixed(2),
            },
            quantity: item.quantity.toString(),
          })),
        },
      ],
    });

    const response = await getPayPalClient().execute(request);

    const nuevaOrden = new ordenes({
      orderId,
      paypalOrderId: response.result.id,
      amount: parsedAmount,
      currency: 'USD',
      usuarioId: user, // Asegúrate que 'user' es el _id del usuario
      productos: items.map((item) => ({
        productId: item.productId,
        cantidad: item.quantity,
        precio: item.price,
      })),
      total: parsedAmount,
      estado: 1, // pendiente
    });
    await nuevaOrden.save(); // <-- Guarda la orden en la base de datos
    res.json({ id: response.result.id });

  } catch (error) {
    console.error('Error creando la orden en PayPal:', error.message, error.stack);
    res.status(500).json({ error: 'Error al crear la orden de pago' });
  }
};

export const captureOrder = async (req, res) => {
  try {
    const { orderID } = req.body;
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    const response = await getPayPalClient().execute(request);

    const updated = await ordenes.findOneAndUpdate(
      { paypalOrderId: orderID },
      {
        estado: 2, // pagado
        payerInfo: response.result.payer,
        paypalResponse: response.result
      },
      { new: true }
    ).populate('usuarioId'); // <-- Corrige el populate

    // Enviar correo
    await sendConfirmationEmail({
      to: updated.user.email,
      subject: 'Confirmación de pago',
      html: `<h2>Hola ${updated.user.name}</h2><p>Tu pago se ha procesado con éxito.</p>`
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
};

export const handleWebhook = async (req, res) => {
  try {
    const isValid = await verifyWebhookSignature(req.headers, req.rawBody);
    if (!isValid) return res.status(400).send('Firma inválida');

    const event = req.body;
    const paypalOrderId = event.resource.id;

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await ordenes.findOneAndUpdate({ paypalOrderId }, { estado: 2 });
        break;
      case 'PAYMENT.CAPTURE.REFUNDED':
        await ordenes.findOneAndUpdate({ paypalOrderId }, { estado: 3 });
        break;
    }

    res.status(200).end();
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).end();
  }
};
