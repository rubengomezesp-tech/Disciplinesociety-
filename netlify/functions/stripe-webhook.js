// netlify/functions/stripe-webhook.js
//
// Phase 3 — Stripe webhook → Supabase orders
//
// Listens for checkout.session.completed events, verifies the Stripe
// signature, and inserts a row into the `orders` table using the
// Supabase service_role key (bypasses RLS — required for server writes).
//
// Required environment variables (set in Netlify → Site settings → Environment variables):
//   STRIPE_SECRET_KEY          → sk_live_... or sk_test_...
//   STRIPE_WEBHOOK_SECRET      → whsec_... (from Stripe webhook endpoint)
//   SUPABASE_URL               → https://xxxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  → service_role key (Project Settings → API)
//
// IMPORTANT: the service_role key must NEVER be exposed in frontend code.
// It lives only inside this serverless function.

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  // Stripe needs the RAW body to verify the signature.
  // Netlify may base64-encode the body — handle both cases.
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Only act on successful checkouts
  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  }

  const session = stripeEvent.data.object;

  // --- user_id ---
  // Passed from the frontend when creating the checkout session
  // (see README → "Pasar user_id a Stripe Checkout").
  const userId =
    session.client_reference_id ||
    (session.metadata && session.metadata.user_id);

  if (!userId) {
    console.warn('No user_id on Stripe session', session.id);
    // Return 200 so Stripe doesn't retry forever — the payment was still valid.
    return { statusCode: 200, body: JSON.stringify({ received: true, skipped: 'no user_id' }) };
  }

  // --- product name ---
  // Retrieve line items to get a human-readable product name
  let productName = 'Discipline Society';
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 5,
    });
    if (lineItems.data.length > 0) {
      productName = lineItems.data.map((i) => i.description).join(' + ');
    }
  } catch (err) {
    console.error('Could not fetch line items:', err.message);
  }

  // --- amount & currency ---
  const amount = (session.amount_total || 0) / 100;
  const currency = (session.currency || 'eur').toLowerCase();

  // --- insert into Supabase ---
  const { error } = await supabase.from('orders').insert({
    user_id: userId,
    product_name: productName,
    amount,
    currency,
    status: 'paid',
    stripe_session_id: session.id,
  });

  if (error) {
    // If it's a duplicate (webhook retry), treat as success
    if (error.code === '23505') {
      return { statusCode: 200, body: JSON.stringify({ received: true, duplicate: true }) };
    }
    console.error('Supabase insert error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
