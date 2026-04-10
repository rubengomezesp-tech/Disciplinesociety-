// assets/js/account.js
// Phase 2 — Profile page logic
import { supabase } from './supabase-client.js';
import { handleLogout } from './auth.js';

// Format ISO date → "12 de marzo, 2026"
function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

async function init() {
  // 1. Gate: require session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.replace('/acceder');
    return;
  }

  const user = session.user;

  // 2. Populate profile fields
  const emailEl = document.getElementById('user-email');
  const dateEl = document.getElementById('user-created');

  if (emailEl) emailEl.textContent = user.email || '—';
  if (dateEl) dateEl.textContent = formatDate(user.created_at);

  // 3. Reveal the content (hidden until session confirmed — avoids flash)
  document.body.classList.add('is-ready');

  // 4. Wire logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      logoutBtn.disabled = true;
      logoutBtn.textContent = 'Cerrando...';
      await handleLogout();
    });
  }

  // 5. React to sign-out from another tab
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      window.location.replace('/acceder');
    }
  });
}

init();
