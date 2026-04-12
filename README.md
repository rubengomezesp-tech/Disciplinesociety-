# Phase 5 — Navegación Dinámica (Acceder / Mi cuenta)

## Archivos

```
assets/js/nav.js          ← NUEVO (lógica del nav dinámico)
nav-snippets.html         ← REFERENCIA (snippets que tú pegas manualmente)
```

Tú decides exactamente dónde va cada enlace dentro de tu nav. Yo solo te doy las piezas.

---

## Cómo funciona

Cualquier elemento con `data-auth="guest"` se muestra **solo si NO hay sesión**.
Cualquier elemento con `data-auth="user"` se muestra **solo si SÍ hay sesión**.
Cualquier elemento con `data-action="logout"` ejecuta logout al hacer click.

El script lee la sesión de Supabase, oculta lo que no toca, y actualiza automáticamente si:
- el usuario hace login en otra pestaña
- el usuario hace logout en otra pestaña
- la sesión expira / se refresca

**Anti-flash:** todos los `[data-auth]` se ocultan al cargar hasta que sabemos el estado real. Así el usuario logueado nunca ve "Acceder" parpadear, y viceversa.

---

## Pasos

### 1. Sube `nav.js`

```
tu-sitio/
└── assets/
    └── js/
        └── nav.js   ← NUEVO
```

### 2. Añade el CSS a tu hoja de estilos

Copia el bloque `<style>` de `nav-snippets.html` y pégalo en tu CSS principal, o dentro de un `<style>` en `index.html`. Ajusta márgenes / tamaños si no encajan con tu nav actual — las clases `ds-nav-link` están aisladas con prefijo para no chocar con nada tuyo.

### 3. Añade los enlaces a tu nav existente

**Desktop nav** — pega dentro de tu contenedor de nav (al final, después de tus links actuales):

```html
<a href="/acceder"    data-auth="guest" class="ds-nav-link">Acceder</a>
<a href="/mi-cuenta"  data-auth="user"  class="ds-nav-link">Mi cuenta</a>
<a href="#"           data-auth="user"  class="ds-nav-link ds-nav-link--muted" data-action="logout">Cerrar sesión</a>
```

**Menú hamburguesa** — pega dentro de tu lista móvil existente:

```html
<a href="/acceder"    data-auth="guest" class="ds-mobile-link">Acceder</a>
<a href="/mi-cuenta"  data-auth="user"  class="ds-mobile-link">Mi cuenta</a>
<a href="#"           data-auth="user"  class="ds-mobile-link ds-mobile-link--muted" data-action="logout">Cerrar sesión</a>
```

### 4. Carga el script en cada página que tenga nav

Justo antes de `</body>`:

```html
<script type="module" src="/assets/js/nav.js"></script>
```

Ponlo en `index.html` y cualquier otra página donde exista el nav. No hace falta en `/mi-cuenta`, `/acceder`, `/registro` (esas ya tienen su propia lógica de sesión).

---

## Verificación

- [ ] **Sin sesión** en `index.html` → ves "Acceder", no ves "Mi cuenta" ni "Cerrar sesión"
- [ ] **Con sesión** en `index.html` → ves "Mi cuenta" + "Cerrar sesión", no ves "Acceder"
- [ ] Click en "Cerrar sesión" → te desloguea y el nav vuelve a mostrar "Acceder"
- [ ] Abres 2 pestañas de home → logueas en una → la otra actualiza el nav automáticamente
- [ ] Menú hamburguesa móvil → mismo comportamiento dentro del menú
- [ ] Al recargar no hay flash de enlaces incorrectos

---

## Ajuste fino del estilo

Si las clases `ds-nav-link` no encajan perfectamente con tu nav actual (espaciado, tamaño, color), puedes:

1. **Opción A** — quitar las clases `ds-nav-link` de los `<a>` y usar las mismas clases que tus links existentes. Los atributos `data-auth` y `data-action` seguirán funcionando igual.
2. **Opción B** — editar los valores en el CSS del snippet para que coincidan con tu tipografía y espaciado actuales.

Lo importante son los **atributos `data-*`**, no las clases — esos son los que el JS lee.

---

## Lo que NO se ha tocado

- `index.html` → tú decides exactamente qué pegar y dónde
- Autenticación, registro, login, `/mi-cuenta`, pedidos, Stripe, webhook, PDF → intactos
- Ningún archivo de Fases 1-4 modificado

Con esto se cierra el ciclo: el usuario llega, se registra, recibe su guía, la encuentra también en su cuenta, compra, ve sus pedidos, y navega con un nav que reconoce quién es. Premium, silencioso, funcional.
