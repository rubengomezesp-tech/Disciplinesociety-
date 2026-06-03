const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const ALLOWED_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const ALLOWED_SIZE_SET = new Set(ALLOWED_SIZES);
const LOCAL_ORIGINS = new Set([
  'http://localhost:8888',
  'http://localhost:8889',
  'http://127.0.0.1:8888',
  'http://127.0.0.1:8889',
]);

const FALLBACK_PRICE_IDS = {
  hoodie: 'price_1TKIi8HIYJhSnGO2hMmiQ2Lu',
  teeBlack: 'price_1TKLmFHIYJhSnGO2z3l8ajPy',
  teeSand: 'price_1TKMmgHIYJhSnGO2zfMYCuaj',
  tracksuit: 'price_1TKUFiHIYJhSnGO20HdJmG3P',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        ...corsHeaders(event),
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(event, 405, { error: 'Method not allowed' });
  }

  const {
    STRIPE_SECRET_KEY,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
  } = process.env;

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json(event, 500, { error: 'Checkout no configurado en el servidor.' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(event, 400, { error: 'JSON invalido.' });
  }

  const selection = resolveSelection(body);
  if (selection.error) {
    return json(event, 400, { error: selection.error });
  }

  const token = getBearerToken(event);
  if (!token) {
    return json(event, 401, { error: 'Inicia sesion para comprar.' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error: userError } = await supabase.auth.getUser(token);
  const user = data && data.user;

  if (userError || !user) {
    return json(event, 401, { error: 'Sesion no valida. Vuelve a acceder.' });
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const origin = siteOrigin(event);

    const metadata = {
      product: selection.product,
      product_label: selection.label,
      size: selection.size,
      user_id: user.id,
    };

    if (selection.color) {
      metadata.color = selection.color;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      line_items: [
        {
          price: selection.priceId,
          quantity: 1,
        },
      ],
      shipping_address_collection: {
        allowed_countries: [
          'ES', 'PT', 'FR', 'IT', 'DE', 'NL', 'BE', 'LU', 'AT', 'IE',
          'DK', 'SE', 'FI', 'PL', 'CZ', 'GR', 'GB', 'US', 'CA', 'MX',
        ],
      },
      metadata,
      allow_promotion_codes: true,
      locale: 'es',
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`,
    });

    return json(event, 200, { id: session.id });
  } catch (err) {
    console.error('[create-checkout]', err);
    return json(event, 500, { error: 'No se pudo iniciar el pago.' });
  }
};

function resolveSelection(body) {
  const product = String(body.product || '').trim();
  const size = String(body.size || '').trim().toUpperCase();
  const color = body.color ? String(body.color).trim().toLowerCase() : '';

  if (!ALLOWED_SIZE_SET.has(size)) {
    return { error: 'Talla no valida.' };
  }

  const catalog = productCatalog();
  const item = catalog[product];

  if (!item) {
    return { error: 'Producto no valido.' };
  }

  if (item.colors) {
    const colorConfig = item.colors[color];

    if (!colorConfig) {
      return { error: 'Color no valido.' };
    }

    const priceId = colorConfig.sizes[size];
    if (!isStripePriceId(priceId)) {
      return { error: 'Esta combinacion no esta disponible.' };
    }

    return {
      product,
      label: item.label,
      size,
      color,
      priceId,
    };
  }

  const priceId = item.sizes[size];
  if (!isStripePriceId(priceId)) {
    return { error: 'Esta talla no esta disponible.' };
  }

  return {
    product,
    label: item.label,
    size,
    color: '',
    priceId,
  };
}

function productCatalog() {
  return {
    'founders-hoodie': {
      label: 'Hoodie Earn Your Place',
      sizes: priceBySize('STRIPE_HOODIE', FALLBACK_PRICE_IDS.hoodie),
    },
    'ds-core-tee': {
      label: 'DS Core Tee',
      colors: {
        black: {
          sizes: priceBySize('STRIPE_TEE_BLACK', FALLBACK_PRICE_IDS.teeBlack),
        },
        sand: {
          sizes: priceBySize('STRIPE_TEE_SAND', FALLBACK_PRICE_IDS.teeSand),
        },
      },
    },
    'ds-core-tracksuit': {
      label: 'DS Discipline Society Tracksuit',
      sizes: priceBySize('STRIPE_TRACKSUIT', FALLBACK_PRICE_IDS.tracksuit),
    },
  };
}

function priceBySize(envPrefix, fallback) {
  const sharedPrice = process.env[`${envPrefix}_PRICE_ID`] || fallback;
  return Object.fromEntries(
    ALLOWED_SIZES.map((size) => [
      size,
      process.env[`${envPrefix}_${size}_PRICE_ID`] || sharedPrice,
    ])
  );
}

function isStripePriceId(value) {
  return /^price_[A-Za-z0-9]{10,}$/.test(String(value || ''));
}

function getBearerToken(event) {
  const authHeader = header(event, 'authorization');
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : '';
}

function json(event, statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(event),
    },
    body: JSON.stringify(body),
  };
}

function corsHeaders(event) {
  const origin = allowedOrigin(event);
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
  };
}

function allowedOrigin(event) {
  const requestOrigin = normalizeOrigin(header(event, 'origin'));
  const configuredOrigin = normalizeOrigin(process.env.SITE_URL);
  const hostOrigin = originFromHost(header(event, 'host'));
  const allowed = new Set(
    [configuredOrigin, hostOrigin, ...LOCAL_ORIGINS].filter(Boolean)
  );

  if (requestOrigin && allowed.has(requestOrigin)) {
    return requestOrigin;
  }

  return configuredOrigin || hostOrigin || requestOrigin || 'https://disciplinesociety.com';
}

function siteOrigin(event) {
  return normalizeOrigin(process.env.SITE_URL) || originFromHost(header(event, 'host')) || 'https://disciplinesociety.com';
}

function originFromHost(host) {
  if (!host) return '';
  const protocol = host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

function normalizeOrigin(value) {
  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

function header(event, name) {
  const headers = event.headers || {};
  const direct = headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()];
  if (direct) return direct;

  const target = name.toLowerCase();
  const foundKey = Object.keys(headers).find((key) => key.toLowerCase() === target);
  return foundKey ? headers[foundKey] : '';
}
