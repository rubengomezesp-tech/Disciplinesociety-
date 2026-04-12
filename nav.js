// assets/js/nav.js
// Phase 5 — Dynamic navigation for Discipline Society
//
// Reads Supabase session and toggles two sets of links inside any nav:
//   [data-auth="guest"]  → visible only when user is NOT logged in
//   [data-auth="user"]   → visible only when user IS logged in
//
// Usage in HTML (desktop nav example):
//   <a href="/acceder" data-auth="guest">Acceder</a>
//   <a href="/mi-cuenta" data-auth="user">Mi cuenta</a>
//   <a href="#" data-auth="user" data-action="logout">Cerrar sesión</a>
//
// Same attributes work inside hamburger menu — no extra code needed.

import { supabase } from './supabase-client.js';
import { handleLogout } from './auth.js';

function applyAuthState(isAuthed) {
  // Show/hide via inline style so we don't fight any existing CSS framework
  document.querySelectorAll('[data-auth="guest"]').forEach((el) => {
    el.style.display = isAuthed ? 'none' : '';
  });
  document.querySelectorAll('[data-auth="user"]').forEach((el) => {
    el.style.display = isAuthed ? '' : 'none';
  });
}

async function init() {
  // Hide everything auth-related until we know the session state
  // (prevents flash of "Acceder" on authenticated users and vice versa)
  document
    .querySelectorAll('[data-auth="guest"], [data-auth="user"]')
    .forEach((el) => {
      el.style.display = 'none';
    });

  // Wire logout buttons once, globally
  document.querySelectorAll('[data-action="logout"]').forEach((el) => {
    el.addEventListener('click', async (e) => {
      e.preventDefault();
      await handleLogout();
    });
  });

  // Initial state
  const { data: { session } } = await supabase.auth.getSession();
  applyAuthState(!!session);

  // Live updates (login in another tab, logout, token refresh...)
  supabase.auth.onAuthStateChange((_event, newSession) => {
    applyAuthState(!!newSession);
  });
}

// Run as soon as DOM is parseable
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
