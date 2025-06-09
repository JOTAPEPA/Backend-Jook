import paypal from '@paypal/checkout-server-sdk';

let client;

export const initPayPalClient = () => {
  const environment = process.env.PAYPAL_MODE === 'live'
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);
  client = new paypal.core.PayPalHttpClient(environment);
};

export const getPayPalClient = () => {
  if (!client) throw new Error('PayPal client no inicializado');
  return client;
};

export const verifyWebhookSignature = async (headers, body) => {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const request = new paypal.notifications.VerifyWebhookSignatureRequest();
  request.requestBody({
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: webhookId,
    webhook_event: JSON.parse(body.toString())
  });

  const response = await getPayPalClient().execute(request);
  return response.result.verification_status === 'SUCCESS';
};
