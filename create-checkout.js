// =========================================
// netlify/functions/create-checkout.js
// Crea una Checkout Session de Stripe
// =========================================
//
// Variables de entorno requeridas (Netlify → Site settings → Environment):
//   STRIPE_SECRET_KEY        → sk_live_... o sk_test_...
//   STRIPE_HOODIE_PRICE_ID   → price_... (el ID del precio del hoodie en Stripe)
//   SITE_URL                 → https://tudominio.com  (sin barra al final)

const Stripe = require('stripe');

const ALLOWED_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const ALLOWED_PRODUCTS = ['founders-hoodie'];

exports.handler = async (event) => {
  // CORS + método
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  // Validar env vars
  const { STRIPE_SECRET_KEY, STRIPE_HOODIE_PRICE_ID, SITE_URL } = process.env;
  if (!STRIPE_SECRET_KEY || !STRIPE_HOODIE_PRICE_ID) {
    return json(500, { error: 'Stripe no está configurado en el servidor.' });
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'JSON inválido.' });
  }

  const { product, size } = body;

  if (!ALLOWED_PRODUCTS.includes(product)) {
    return json(400, { error: 'Producto no válido.' });
  }
  if (!ALLOWED_SIZES.includes(size)) {
    return json(400, { error: 'Talla no válida.' });
  }

  // Crear la Checkout Session
  try {
    const stripe = Stripe(STRIPE_SECRET_KEY);
    const origin = SITE_URL || `https://${event.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_HOODIE_PRICE_ID,
          quantity: 1,
        },
      ],
      // Recoger dirección de envío
      shipping_address_collection: {
        allowed_countries: [
          'ES', 'PT', 'FR', 'IT', 'DE', 'NL', 'BE', 'LU', 'AT', 'IE',
          'DK', 'SE', 'FI', 'PL', 'CZ', 'GR', 'GB', 'US', 'CA', 'MX',
        ],
      },
      // Guardar la talla en metadata para poder verla en el dashboard
      metadata: {
        product,
        size,
      },
      // Si hay envíos con coste, descomenta y crea shipping rates en Stripe
      // shipping_options: [{ shipping_rate: 'shr_...' }],
      allow_promotion_codes: true,
      locale: 'es',
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`,
    });

    return json(200, { id: session.id });
  } catch (err) {
    console.error('[create-checkout]', err);
    return json(500, { error: err.message || 'Error interno.' });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}
