import paypal from '@paypal/checkout-server-sdk';
import { getPayPalClient, verifyWebhookSignature } from '../utils/paypalClient.js';
import { sendConfirmationEmail } from '../utils/emailSender.js';
import ordenes from '../Models/ordenes.js'; // Importa el modelo 'ordenes'

// Tasa de cambio (ajusta esto a tu valor actual o a una API de tasa de cambio)
const exchangeRateCOP_to_USD = 4000; // Ejemplo: 1 USD = 4000 COP

export const createOrder = async (req, res) => {
  try {
    // ¡Asegúrate de desestructurar customerInfo de req.body!
    const { amount, items, user, orderId, customerInfo } = req.body;

    // Validaciones básicas
    if (!amount || !items || !user || !orderId || !customerInfo) {
      return res.status(400).json({ error: 'Faltan datos necesarios en la solicitud (monto, ítems, usuario, ID de orden o información del cliente).' });
    }
    // Validar que customerInfo tenga los campos requeridos
    if (!customerInfo.nombre || !customerInfo.apellidos || !customerInfo.email || !customerInfo.direccion || !customerInfo.pais || !customerInfo.provincia || !customerInfo.ciudad || !customerInfo.telefonoMovil) {
        return res.status(400).json({ error: 'Información del cliente incompleta.' });
    }

    const parsedAmountUSD = parseFloat(amount); // Este 'amount' ya viene en USD desde el frontend
    if (isNaN(parsedAmountUSD)) {
      return res.status(400).json({ error: 'El amount no es válido' });
    }

    // Convertir los precios de los ítems de COP a USD para PayPal
    let itemTotalSumUSD = 0;
    const itemsForPayPal = items.map((item) => {
      const priceInCOP = parseFloat(item.price);
      if (isNaN(priceInCOP)) {
        throw new Error(`El precio del ítem ${item.name} no es válido.`);
      }
      const priceInUSD = (priceInCOP / exchangeRateCOP_to_USD).toFixed(2);
      itemTotalSumUSD += parseFloat(priceInUSD);
      return {
        name: item.name,
        unit_amount: {
          currency_code: 'USD',
          value: priceInUSD,
        },
        quantity: item.quantity.toString(),
      };
    });

    // Asegurarse de que itemTotalSumUSD esté redondeado para el breakdown de PayPal
    itemTotalSumUSD = parseFloat(itemTotalSumUSD).toFixed(2);

    // Asumimos que los 700 COP de envío son fijos y también deben convertirse
    const shippingCostCOP = 700;
    const shippingCostUSD = (shippingCostCOP / exchangeRateCOP_to_USD).toFixed(2);
    
    // Calcular el valor del envío en USD si está incluido en el amount total
    // parsedAmountUSD (viene del frontend, ya incluye envío en USD)
    // itemTotalSumUSD (suma de precios de items en USD)
    // La diferencia es el envío en USD
    const calculatedShippingValueUSD = (parsedAmountUSD - parseFloat(itemTotalSumUSD)).toFixed(2);


    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: orderId,
          amount: {
            currency_code: 'USD',
            value: parsedAmountUSD.toFixed(2), // El total ya viene en USD desde el frontend
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: itemTotalSumUSD, // Suma de los precios de los ítems en USD
              },
              shipping: { // Agregar el desglose del envío
                currency_code: 'USD',
                value: calculatedShippingValueUSD,
              },
            },
          },
          items: itemsForPayPal, // Ítems con precios convertidos a USD
          // Puedes añadir la dirección de envío aquí si PayPal la necesita en createOrder
          // shipping: {
          //   address: {
          //     address_line_1: customerInfo.direccion,
          //     admin_area_2: customerInfo.ciudad,
          //     admin_area_1: customerInfo.provincia, // state code
          //     postal_code: customerInfo.codigoPostal,
          //     country_code: customerInfo.pais // country ISO code
          //   }
          // }
        },
      ],
    });

    const response = await getPayPalClient().execute(request);

    // Guardar la orden en tu base de datos
    const nuevaOrden = new ordenes({
      orderId,
      paypalOrderId: response.result.id,
      amount: parsedAmountUSD, // Monto total en USD
      currency: 'USD', // Moneda de la transacción en PayPal
      usuarioId: user, // Ahora se usa 'usuarioId' como en tu nuevo esquema
      productos: items.map((item) => ({
        productId: item.productId,
        cantidad: item.quantity,
        precio: parseFloat(item.price), // Mantener el precio original en COP en la DB
      })),
      total: parsedAmountUSD, // Total de la orden en USD
      estado: 1, // pendiente (1: Pendiente, 2: Pagado, 3: Reembolsado, etc.)
      customerInfo: customerInfo, // ¡Guarda el objeto customerInfo completo!
    });
    await nuevaOrden.save();

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
        payerInfo: response.result.payer, // Se guarda en ordenes
        paypalResponse: response.result // Se guarda en ordenes
      },
      { new: true }
    ).populate('usuarioId');

    if (!updated) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }
    if (!updated.usuarioId) {
      console.warn(`Usuario no encontrado para la orden PayPal ID: ${orderID}`);
    }

    // Enviar correo de confirmación
    // Acceder a la información del cliente desde customerInfo si usuarioId no está completo
    const recipientEmail = updated.usuarioId?.email || updated.customerInfo?.email;
    const recipientName = updated.usuarioId?.name || updated.customerInfo?.nombre;

    if (recipientEmail && recipientName) {
      await sendConfirmationEmail({
        to: recipientEmail,
        subject: 'Confirmación de pago de tu compra',
        html: `<h2>Hola ${recipientName}</h2>
               <p>Tu pago se ha procesado con éxito y tu orden #${updated.orderId} está en camino.</p>
               <p>ID de la transacción: ${orderID}</p>
               <p>Revisa los detalles de tu compra en tu perfil.</p>
               <p>¡Gracias por tu compra!</p>`
      });
    } else {
      console.warn('No se pudo enviar el correo de confirmación: Falta información del usuario o cliente en la orden.');
    }

    res.json({ success: true, order: updated });
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
      // Puedes añadir más casos para otros eventos de webhook si es necesario
      default:
        console.log(`Evento de webhook no manejado: ${event.event_type}`);
    }

    res.status(200).end();
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).end();
  }
};