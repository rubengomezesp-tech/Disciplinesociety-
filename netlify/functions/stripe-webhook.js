// netlify/functions/stripe-webhook.js
//
// Stripe webhook -> Supabase orders.
// Verifies Stripe's signature, then stores paid checkout sessions in Supabase
// using the service_role key. The service_role key must never be exposed in
// frontend code.

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const {
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  } = process.env;

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[stripe-webhook] Missing required environment variables.');
    return { statusCode: 500, body: 'Webhook is not configured.' };
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const sig = header(event, 'stripe-signature');
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64')
    : Buffer.from(event.body || '', 'utf8');

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return ok({ received: true, ignored: stripeEvent.type });
  }

  const session = stripeEvent.data.object;
  const metadata = session.metadata || {};
  const userId = session.client_reference_id || metadata.user_id;

  if (!userId || !UUID_REGEX.test(userId)) {
    console.warn('[stripe-webhook] Missing or invalid user_id on session', session.id);
    return ok({ received: true, skipped: 'invalid_user_id' });
  }

  let productName = metadata.product_label || 'Discipline Society';

  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 5,
    });

    if (lineItems.data.length > 0) {
      productName = lineItems.data
        .map((item) => item.description)
        .filter(Boolean)
        .join(' + ') || productName;
    }
  } catch (err) {
    console.error('[stripe-webhook] Could not fetch line items:', err.message);
  }

  const amount = (session.amount_total || 0) / 100;
  const currency = (session.currency || 'eur').toLowerCase();
  const paymentIntent = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : null;

  const { error } = await supabase.from('orders').insert({
    user_id: userId,
    product_id: metadata.product || null,
    product_name: productName,
    size: metadata.size || null,
    color: metadata.color || null,
    amount,
    currency,
    status: 'paid',
    stripe_session_id: session.id,
    stripe_payment_intent: paymentIntent,
  });

  if (error) {
    if (error.code === '23505') {
      return ok({ received: true, duplicate: true });
    }

    console.error('[stripe-webhook] Supabase insert error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  return ok({ received: true });
};

function ok(body) {
  return {
    statusCode: 200,
    body: JSON.stringify(body),
  };
}

function header(event, name) {
  const headers = event.headers || {};
  const target = name.toLowerCase();
  const foundKey = Object.keys(headers).find((key) => key.toLowerCase() === target);
  return foundKey ? headers[foundKey] : '';
}
