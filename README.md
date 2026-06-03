# Discipline Society

Storefront estatica para Discipline Society con autenticacion Supabase, Stripe Checkout, pedidos en Supabase, formulario de acceso anticipado y despliegue en Netlify.

## Stack

- HTML/CSS/JavaScript sin framework
- Netlify Static Hosting + Netlify Functions
- Stripe Checkout
- Supabase Auth + Postgres/RLS
- Resend opcional para emails de bienvenida

## Desarrollo local

```bash
npm install
npm run check
```

Para probar funciones serverless en local, instala/usa Netlify CLI y ejecuta:

```bash
netlify dev
```

Copia `.env.example` a `.env` y rellena las variables reales. No subas `.env`.

## Variables necesarias

Stripe:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_HOODIE_PRICE_ID`
- `STRIPE_TEE_BLACK_PRICE_ID`
- `STRIPE_TEE_SAND_PRICE_ID`
- `STRIPE_TRACKSUIT_PRICE_ID`

Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Sitio:

- `SITE_URL`

Resend opcional:

- `RESEND_API_KEY`
- `FROM_EMAIL`
- `ADMIN_EMAIL`

## Supabase

Ejecuta [`sql/orders.sql`](sql/orders.sql) en Supabase SQL Editor.
Ejecuta tambien [`sql/admin-images.sql`](sql/admin-images.sql) para habilitar el panel de imagenes.

La tabla `orders` tiene RLS activo:

- Los usuarios autenticados solo pueden leer sus propios pedidos.
- El frontend no puede insertar pedidos.
- El webhook de Stripe inserta pedidos usando `SUPABASE_SERVICE_ROLE_KEY`.

## Admin de imagenes

Panel:

```text
/admin.html
```

Para dar acceso, crea el usuario en Supabase Auth y despues inserta su `user_id` en `public.site_admins`. El archivo [`sql/admin-images.sql`](sql/admin-images.sql) incluye el ejemplo por email al final.

El admin permite cambiar:

- Logo principal
- DS Core Tee negro
- DS Core Tee arena
- DS Tracksuit principal/detalle
- Hoodie EYP principal/detalle

## Checkout

El navegador solo envia `product`, `size` y `color` junto al token de sesion de Supabase. La funcion [`netlify/functions/create-checkout.js`](netlify/functions/create-checkout.js) valida la sesion en servidor y decide el Price ID permitido desde variables de entorno.

Configura el webhook de Stripe hacia:

```text
https://TU_DOMINIO/.netlify/functions/stripe-webhook
```

Evento requerido:

```text
checkout.session.completed
```

## Verificacion rapida

```bash
npm run check
```

Flujo manual recomendado antes de publicar:

- Registro/login con Supabase.
- Compra de cada producto con usuario autenticado.
- Redireccion a Stripe Checkout.
- Webhook recibido y pedido visible en `/mi-cuenta.html`.
- `/guia` abre `/assets/pdf/guia-privada.pdf`.
