const Stripe = require('stripe');

const ALLOWED_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const ALLOWED_PRODUCTS = ['founders-hoodie', 'ds-core-tee', 'ds-core-tracksuit'];
const ALLOWED_COLORS = ['black', 'sand'];

exports.handler = async (event) => {
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

  const { STRIPE_SECRET_KEY, SITE_URL } = process.env;
  if (!STRIPE_SECRET_KEY) {
    return json(500, { error: 'Stripe no está configurado en el servidor.' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'JSON inválido.' });
  }

  const { product, size, color, priceId } = body;

  if (!ALLOWED_PRODUCTS.includes(product)) {
    return json(400, { error: 'Producto no válido.' });
  }

  if (!ALLOWED_SIZES.includes(size)) {
    return json(400, { error: 'Talla no válida.' });
  }

  // El color solo es obligatorio para productos que lo tengan
  if (product === 'ds-core-tee') {
    if (!ALLOWED_COLORS.includes(color)) {
      return json(400, { error: 'Color no válido.' });
    }
  }

  if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) {
    return json(400, { error: 'Price ID no válido.' });
  }

  try {
    const stripe = Stripe(STRIPE_SECRET_KEY);
    const origin = SITE_URL || `https://${event.headers.host}`;

    // Metadatos — incluye color solo si existe
    const metadata = { product, size };
    if (color) metadata.color = color;

    const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  payment_method_types: ['card'],

  client_reference_id: body.userId, // 🔥 CLAVE

  line_items: [
    {
      price: priceId,
      quantity: 1,
    },
  ],

  shipping_address_collection: {
    allowed_countries: [
      'ES','PT','FR','IT','DE','NL','BE','LU','AT','IE',
      'DK','SE','FI','PL','CZ','GR','GB','US','CA','MX',
    ],
  },

  metadata,
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
