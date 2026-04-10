# Discipline Society — Phase 1: Authentication

## Files included

```
acceder.html              → /acceder (login page)
registro.html             → /registro (signup page)
assets/js/supabase-client.js
assets/js/auth.js
```

## Deploy structure

Upload to your project root, keeping the folder structure:

```
your-site/
├── index.html                    (untouched)
├── acceder.html                  (new)
├── registro.html                 (new)
└── assets/
    └── js/
        ├── supabase-client.js    (new)
        └── auth.js               (new)
```

Netlify will serve `acceder.html` at `/acceder` and `registro.html` at `/registro` automatically.

## Supabase setup (do this first)

1. Go to https://supabase.com → create a new project.
2. Wait ~2 min for provisioning.
3. **Project Settings → API** → copy:
   - Project URL
   - anon public key
4. Open `assets/js/supabase-client.js` and replace:
   - `YOUR-PROJECT.supabase.co` → your Project URL
   - `YOUR-ANON-PUBLIC-KEY` → your anon key
5. **Authentication → Providers** → make sure **Email** is enabled.
6. **Authentication → Sign In / Providers → Email** → for testing, **disable "Confirm email"**. Re-enable later when you set up SMTP.
7. **Authentication → URL Configuration** → set **Site URL** to your Netlify domain (e.g. `https://disciplinesociety.com`).

## Testing

1. Deploy to Netlify.
2. Visit `/registro` → create an account.
3. Check **Supabase → Authentication → Users** — your user should appear.
4. Visit `/acceder` → log in → you'll be redirected to `/`.
5. DevTools → Application → Local Storage → look for `sb-xxxxx-auth-token` (this is your persisted session).

To test logout from the console (button comes in Phase 5):
```js
import('/assets/js/auth.js').then(m => m.handleLogout());
```

## What's NOT in Phase 1

- `/mi-cuenta` page → Phase 2
- Dynamic nav (Acceder / Mi cuenta) → Phase 5
- Stripe order linking → Phase 3
- Protected content → Phase 4

Nothing in `index.html`, Stripe, or Netlify forms has been touched.
