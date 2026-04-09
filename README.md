# Discipline Society — Founders Landing

Landing de `disciplinesociety.com`. Static site + Netlify Functions. Stripe Checkout para el Founders Hoodie y captura de emails para acceso anticipado.

---

## Estructura del repo

```
/
├── index.html                          ← Landing principal
├── gracias.html                        ← Post-suscripción email
├── success.html                        ← Post-compra (Stripe redirect)
├── cancel.html                         ← Compra cancelada
├── hoodie.jpg                          ← Imagen del hoodie
├── ds-logo.png                         ← Logo DS (SUBIR TÚ)
├── Protocolo-30-Dias-Discipline-Society.pdf
├── netlify.toml                        ← Config de Netlify
├── package.json                        ← Dependencias (stripe, resend)
├── .env.example                        ← Plantilla de variables
├── .gitignore
└── netlify/
    └── functions/
        ├── create-checkout.js          ← Stripe Checkout Session
        └── subscribe.js                ← Email de bienvenida (Resend)
```

---

## 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Discipline Society — founders landing"
git branch -M main
git remote add origin git@github.com:TU_USUARIO/discipline-society.git
git push -u origin main
```

No subas `.env` (ya está en `.gitignore`).

---

## 2. Conectar con Netlify

1. Entra a [app.netlify.com](https://app.netlify.com) → **Add new site → Import from GitHub**.
2. Selecciona el repo. Netlify detectará el `netlify.toml` automáticamente.
3. **Build command**: déjalo vacío. **Publish directory**: `.`
4. Deploy. La primera build instala `stripe` y `resend` desde `package.json`.

---

## 3. Configurar Stripe (obligatorio para el hoodie)

### 3.1 Crear el producto

[dashboard.stripe.com](https://dashboard.stripe.com) → **Products → + Add product**

- Nombre: `Founders Hoodie`
- Precio: `89.00 EUR` (one-time)
- Guardar y copiar el **Price ID** (empieza por `price_...`)

### 3.2 Obtener las API keys

Dashboard → **Developers → API keys**

- **Publishable key** (`pk_live_...` o `pk_test_...`) → va en `index.html`
- **Secret key** (`sk_live_...` o `sk_test_...`) → va en variables de Netlify

### 3.3 Pegar la publishable key en `index.html`

Busca esta línea y reemplázala:

```js
const STRIPE_PUBLISHABLE_KEY = 'pk_test_REEMPLAZA_CON_TU_CLAVE_PUBLICA';
```

Commit + push. Netlify redeploya solo.

### 3.4 Variables de entorno en Netlify

Netlify → Site → **Site settings → Environment variables → Add a variable**

| Variable                  | Valor                                      |
| ------------------------- | ------------------------------------------ |
| `STRIPE_SECRET_KEY`       | `sk_live_...` (tu secret key)              |
| `STRIPE_HOODIE_PRICE_ID`  | `price_...` (el del hoodie)                |
| `SITE_URL`                | `https://disciplinesociety.com`            |

Después de añadirlas, **Deploys → Trigger deploy → Clear cache and deploy site**.

---

## 4. Configurar emails (opcional pero recomendado)

Los emails del formulario de acceso anticipado **ya se capturan automáticamente** en Netlify → Forms → `early-access`, sin configurar nada.

Si además quieres enviar email de bienvenida al suscriptor:

### 4.1 Crear cuenta en Resend

1. [resend.com](https://resend.com) → Sign up (gratis hasta 3000 emails/mes).
2. **Domains → Add domain** → `tudominio.com`. Pega los DNS en tu proveedor.
3. Espera a que el dominio esté verificado.
4. **API Keys → Create API Key** → copia la clave (`re_...`).

### 4.2 Añadir variables en Netlify

| Variable         | Valor                                        |
| ---------------- | -------------------------------------------- |
| `RESEND_API_KEY` | `re_...`                                     |
| `FROM_EMAIL`     | `Discipline Society <hola@tudominio.com>`    |
| `ADMIN_EMAIL`    | `tu@email.com` (opcional, recibe los leads)  |

Redeploya. A partir de ese momento, cada suscriptor recibe un email de bienvenida con el estilo de la marca.

---

## 5. Archivos que tienes que subir tú

- **`ds-logo.png`** → el logo DS del header/footer. Ponlo en la raíz.
- **`hoodie.jpg`** → ya está incluido, pero si quieres otra imagen, reemplázala.

---

## 6. Probar en local

```bash
npm install -g netlify-cli
netlify login
netlify link            # vincula con tu site
netlify dev             # sirve localhost:8888 con las functions activas
```

Para probar el checkout sin cobrar de verdad, usa las **claves de test** de Stripe y la tarjeta `4242 4242 4242 4242` (cualquier fecha futura, cualquier CVC).

---

## 7. Checklist final antes de vender

- [ ] `ds-logo.png` subido a la raíz
- [ ] `STRIPE_PUBLISHABLE_KEY` en `index.html` (clave **live**)
- [ ] `STRIPE_SECRET_KEY` en Netlify env vars (clave **live**)
- [ ] `STRIPE_HOODIE_PRICE_ID` en Netlify env vars
- [ ] `SITE_URL` apuntando al dominio real
- [ ] Probado un pedido real con la tarjeta de test
- [ ] En Stripe: **Activar cuenta** (datos fiscales, IBAN, verificación)
- [ ] Política de privacidad y términos enlazados en el footer (requisito UE)
- [ ] Dominio conectado en Netlify → Domain settings

---

## Detalles útiles

- **Cambiar precio**: créalo en Stripe y actualiza `STRIPE_HOODIE_PRICE_ID`. El frontend no toca nada.
- **Añadir más tallas**: ya está todo preparado. La talla se guarda en `metadata.size` de cada Checkout Session — la ves en el dashboard de Stripe para cada pedido.
- **Países de envío**: edítalos en `netlify/functions/create-checkout.js` → `shipping_address_collection.allowed_countries`.
- **Costes de envío**: crea un *shipping rate* en Stripe y descomenta `shipping_options` en la misma función.
- **Ver leads**: Netlify → Forms → `early-access`. Se pueden exportar a CSV.
- **Ver pedidos**: dashboard.stripe.com → Payments.

---

© MMXXVI · Discipline Society · Miami · Barcelona
