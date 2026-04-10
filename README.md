# Phase 3 — Order System (Stripe → Supabase → /mi-cuenta)

## Archivos de esta fase

```
sql/orders.sql                          ← SQL para la tabla
netlify/functions/stripe-webhook.js     ← Webhook Stripe → Supabase
netlify/functions/package.json          ← Dependencias del webhook
assets/js/account.js                    ← ACTUALIZADO (ahora lista pedidos)
mi-cuenta.html                          ← ACTUALIZADO (nuevo contenedor de pedidos)
```

Lo único que cambia de Fase 2 son `account.js` y `mi-cuenta.html` — los dos archivos de la sección "Pedidos" donde antes había un placeholder. El resto (autenticación, login, registro, perfil) queda intacto.

---

## PASO 1 — Crear la tabla en Supabase

1. Ve a Supabase → **SQL Editor** → **New Query**
2. Pega el contenido de `sql/orders.sql`
3. Pulsa **Run**

Esto crea:
- Tabla `orders` con las columnas pedidas (+ `currency` y `stripe_session_id` para robustez)
- Índice por `user_id` + fecha
- **Row Level Security activado** — cada usuario solo puede ver SUS pedidos
- **Sin policy de INSERT** → nadie puede crear pedidos desde el frontend. Solo el webhook (que usa la service_role key) puede escribir. Esta es la garantía de seguridad.

---

## PASO 2 — Configurar variables de entorno en Netlify

Ve a **Netlify → Site settings → Environment variables** y añade:

| Variable | Dónde conseguirla |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Se crea en el PASO 4 |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → **service_role** key (¡la secreta!) |

⚠️ **IMPORTANTE:** La `service_role` key es una llave maestra. NUNCA la pongas en código frontend, solo en variables de entorno de Netlify.

---

## PASO 3 — Subir los archivos

Sube la estructura manteniendo carpetas:

```
tu-sitio/
├── mi-cuenta.html                          ← reemplaza el anterior
├── netlify/
│   └── functions/
│       ├── stripe-webhook.js               ← NUEVO
│       └── package.json                    ← NUEVO
├── sql/
│   └── orders.sql                          ← (referencia, no se despliega)
└── assets/
    └── js/
        └── account.js                      ← reemplaza el anterior
```

Si ya tenías `netlify/functions/package.json` con otras dependencias, **no lo sobrescribas** — solo añade estas dos líneas a `dependencies`:

```json
"@supabase/supabase-js": "^2.45.0",
"stripe": "^16.0.0"
```

Haz commit + push. Netlify detectará la función automáticamente y la desplegará en:

```
https://tu-dominio.com/.netlify/functions/stripe-webhook
```

---

## PASO 4 — Registrar el webhook en Stripe

1. Ve a **Stripe Dashboard → Developers → Webhooks → Add endpoint**
2. **Endpoint URL:** `https://tu-dominio.com/.netlify/functions/stripe-webhook`
3. **Events to send:** selecciona solo `checkout.session.completed`
4. Guarda
5. Copia el **Signing secret** (empieza por `whsec_...`)
6. Pégalo en Netlify como `STRIPE_WEBHOOK_SECRET`
7. Redeploy del sitio (para que la función lea la nueva variable)

---

## PASO 5 — Pasar `user_id` a Stripe Checkout ⚠️ CRÍTICO

Esto es lo único que tienes que tocar en tu código de checkout actual. Sin esto, el webhook no sabe a qué usuario asociar el pedido.

En el punto donde creas la sesión de Stripe Checkout (ya sea en el frontend con `stripe.redirectToCheckout` o en otra Netlify Function), **añade `client_reference_id` con el ID del usuario logueado**.

### Si usas Stripe desde el frontend (Payment Links / redirectToCheckout):

```js
import { supabase } from '/assets/js/supabase-client.js';

async function iniciarCompra() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = '/acceder';
    return;
  }

  // Añade el user_id como query param al Payment Link
  const paymentLink = 'https://buy.stripe.com/TU_PAYMENT_LINK';
  window.location.href = `${paymentLink}?client_reference_id=${session.user.id}`;
}
```

### Si creas la sesión desde una Netlify Function:

```js
const checkoutSession = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [ /* ... */ ],
  success_url: 'https://tu-dominio.com/gracias',
  cancel_url: 'https://tu-dominio.com/',

  // 👇 AÑADE ESTA LÍNEA
  client_reference_id: userId, // lo pasas desde el frontend al llamar a la función
});
```

Si un usuario compra sin estar logueado, el webhook no podrá asociar el pedido y lo descartará silenciosamente (con un warning en los logs). El pago aún se procesa normal — simplemente no aparecerá en "Mi cuenta". Para máxima cobertura, requiere login antes del checkout.

---

## PASO 6 — Probar el flujo completo

1. Loguéate en `/acceder`
2. Ve a `/mi-cuenta` → sección Pedidos → debería decir "Aún no tienes pedidos registrados"
3. Haz una compra de prueba con una tarjeta Stripe test (`4242 4242 4242 4242`)
4. Vuelve a `/mi-cuenta` → el pedido debe aparecer con producto, fecha, importe y estado "Pagado"
5. Verifica en **Supabase → Table Editor → orders** que la fila existe
6. Verifica en **Stripe → Webhooks → tu endpoint → logs** que el evento llegó con status 200

### Si algo falla

- **El pedido no aparece pero el pago se cobró:** mira los logs del webhook en Netlify (**Functions → stripe-webhook → Logs**) y en Stripe (**Webhooks → endpoint → Recent deliveries**). El error más común es no haber pasado `client_reference_id` al crear el checkout.
- **Signature verification failed:** la `STRIPE_WEBHOOK_SECRET` no coincide. Copia de nuevo el signing secret de Stripe y redeploy.
- **Permission denied leyendo orders:** la RLS está bien, pero comprueba que estás logueado al abrir `/mi-cuenta` — solo usuarios autenticados pueden consultar.

---

## Seguridad — resumen

- ✅ RLS activa en `orders`, policy de SELECT = `auth.uid() = user_id`
- ✅ Sin policy de INSERT → imposible crear pedidos falsos desde frontend
- ✅ El webhook verifica la firma de Stripe antes de procesar
- ✅ La service_role key solo vive en variables de entorno de Netlify, nunca en el cliente
- ✅ Deduplicación por `stripe_session_id` (si Stripe reintenta el webhook, no se duplica)

---

## Lo que NO cambia

- `index.html` → intacto
- `acceder.html`, `registro.html` → intactos
- `supabase-client.js`, `auth.js` → intactos
- Flujo de Stripe existente → intacto (solo añades `client_reference_id`)
- Netlify Forms → intactos
