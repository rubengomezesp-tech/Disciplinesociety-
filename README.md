# Phase 2 — Profile Page (/mi-cuenta)

## Files

```
mi-cuenta.html            → served at /mi-cuenta
assets/js/account.js      → profile logic
```

Nothing from Phase 1 is modified. This phase only **adds** files.

## Deploy structure

```
your-site/
├── index.html              (untouched)
├── acceder.html            (Phase 1)
├── registro.html           (Phase 1)
├── mi-cuenta.html          (NEW — Phase 2)
└── assets/js/
    ├── supabase-client.js  (Phase 1)
    ├── auth.js             (Phase 1)
    └── account.js          (NEW — Phase 2)
```

## What it does

1. **Protected access** — on load, checks session via Supabase. No session → redirects to `/acceder`. Content stays hidden until session is confirmed (prevents flash of protected UI).
2. **Shows profile info** — email + "Miembro desde" (formatted in Spanish, e.g. "12 de marzo, 2026").
3. **Logout button** — signs out and redirects to `/acceder`.
4. **Cross-tab sync** — if the user logs out in another tab, this page auto-redirects too.
5. **Placeholders** — "Pedidos" and "Acceso Exclusivo" sections are visual placeholders, ready to be wired in Phases 3 and 4.

## Testing

1. Without logging in, visit `/mi-cuenta` → should redirect to `/acceder`.
2. Log in at `/acceder` → manually go to `/mi-cuenta` → should show your email and registration date.
3. Click **Cerrar Sesión** → should redirect to `/acceder`.
4. Open `/mi-cuenta` in two tabs, log out in one → the other should auto-redirect.

## What's NOT in this phase

- Real order data (Phase 3)
- Real exclusive content / PDF access (Phase 4)
- Nav bar link to `/mi-cuenta` (Phase 5)

To reach the page for now, just type `/mi-cuenta` in the URL bar after logging in.
