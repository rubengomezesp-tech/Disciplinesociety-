# Phase 4 — Contenido Exclusivo + Gracias Premium

## Archivos a sustituir / crear

```
mi-cuenta.html                        ← REEMPLAZAR (versión Phase 3 → Phase 4)
gracias.html                          ← REEMPLAZAR
assets/pdf/discipline-protocol.pdf    ← NUEVO (tu PDF existente, renombrado o movido aquí)
```

**Eso es todo.** No se toca nada de JS, Stripe, webhook, Supabase, autenticación ni pedidos. Solo HTML y un archivo estático.

---

## Qué he cambiado

### 1. `mi-cuenta.html`
- Añadida la sección **"Contenido Exclusivo"** debajo de Pedidos.
- Nuevo bloque visual `.vault-item` (borde fino, hover dorado, CTA editorial) que se integra con las fichas existentes sin parecer un dashboard.
- Enlace al PDF vía `/assets/pdf/discipline-protocol.pdf`.
- Todo lo demás (perfil, pedidos, logout, `account.js`) sigue exactamente igual.

### 2. `gracias.html`
- Rediseñada por completo manteniendo el lenguaje black/gold.
- Estructura editorial: eyebrow dorado → título "Estás Dentro" → divisor → copy premium → whisper line → 2 CTAs.
- CTA primario dorado sólido: **"Ir a mi cuenta"**.
- CTA secundario ghost: **"Explorar la colección"**.
- Firma inferior: **"Built Under Pressure"** (de tu identidad de marca).
- Animación `fadeUp` sutil al cargar.

---

## Por qué PDF estático y no Supabase Storage

Para esta fase he elegido **archivo estático** dentro del proyecto porque:

1. **Simplicidad máxima** — subes el PDF una vez, Netlify lo sirve desde su CDN global. Cero infraestructura nueva.
2. **Sin latencia** — carga instantánea, sin llamadas a API.
3. **La página `/mi-cuenta` ya está protegida** por la lógica de sesión en `account.js` (sin login → redirect a `/acceder`). El enlace al PDF solo es visible para usuarios autenticados.
4. **Mantenimiento trivial** — si actualizas la guía, reemplazas el archivo y haces deploy.

**Tradeoff honesto:** alguien con la URL directa (`tudominio.com/assets/pdf/discipline-protocol.pdf`) podría acceder sin estar logueado. Para Fase 4 con una guía gratuita de captación esto es aceptable (de hecho la mandas por email, que es el mismo nivel de apertura).

Si en el futuro quieres **PDFs realmente privados** (p. ej. ebooks premium de pago), se migra a **Supabase Storage con signed URLs** generadas desde una Netlify Function. Esa migración es sencilla y no rompe nada de esta fase.

---

## Pasos exactos

1. **Sube tu PDF actual** a la carpeta `assets/pdf/` de tu proyecto. Renómbralo a `discipline-protocol.pdf` (o cambia el `href` del `vault-cta` en `mi-cuenta.html` al nombre real).

   ```
   tu-sitio/
   └── assets/
       └── pdf/
           └── discipline-protocol.pdf
   ```

2. **Reemplaza** `mi-cuenta.html` por la versión de Phase 4.
3. **Reemplaza** `gracias.html` por la versión de Phase 4.
4. Commit + push → Netlify despliega.

---

## Verificación

- [ ] Entra en `/mi-cuenta` logueado → ves la nueva sección "Contenido Exclusivo" con el bloque "Guía Privada".
- [ ] Click en "Abrir contenido" → descarga / abre el PDF.
- [ ] Entra en `/gracias` → ves el nuevo diseño con los dos CTAs.
- [ ] Pedidos siguen listándose correctamente (sin regresiones de Phase 3).
- [ ] Login / logout / registro siguen funcionando (sin regresiones de Phase 1).
- [ ] Stripe y webhook no se han tocado → siguen operativos.

---

## Copy premium usado (por si quieres ajustarlo)

**En `mi-cuenta.html` → sección Contenido Exclusivo:**
- Tag: *Primer Protocolo*
- Título: *Guía Privada*
- Descripción: *"El punto de partida. Los principios silenciosos sobre los que se construye un físico y una mente de élite. Lectura reservada para miembros de Discipline Society."*

**En `gracias.html`:**
- Eyebrow: *Acceso Concedido*
- Título: *Estás Dentro*
- Body 1: *"Tu guía privada ha sido enviada a tu correo. Revísalo con la misma atención con la que entrenas."*
- Body 2: *"A partir de ahora formas parte del círculo. **Lo que viene no es para todos.**"*
- Whisper: *— Silencio. Enfoque. Ejecución. —*
- Firma: *Built Under Pressure*

Todo sustituible sin tocar CSS ni JS.

---

## Lo que NO se ha tocado

- `index.html`
- `acceder.html`, `registro.html`
- `assets/js/supabase-client.js`, `auth.js`, `account.js`
- `netlify/functions/stripe-webhook.js` y demás funciones
- Tabla `orders` en Supabase
- Flujo de Stripe Checkout

Fase 4 es puramente **aditiva y cosmética** sobre la base ya sólida.
