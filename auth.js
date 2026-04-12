// assets/js/auth.js
import { supabase } from './supabase-client.js';

// --- helpers ---
const showMessage = (el, text, type = 'error') => {
  if (!el) return;
  el.textContent = text;
  el.className = `form-message ${type}`;
  el.style.display = 'block';
};
const clearMessage = (el) => {
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
};

// Traduce los errores de Supabase a español legible
function translateError(error) {
  if (!error) return 'Error desconocido.';
  const msg = error.message || '';
  if (msg.includes('Email not confirmed'))
    return 'Confirma tu correo antes de acceder. Revisa tu bandeja de entrada.';
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials'))
    return 'Email o contraseña incorrectos.';
  if (msg.includes('Email rate limit exceeded') || msg.includes('over_email_send_rate_limit'))
    return 'Demasiados intentos. Espera unos minutos.';
  if (msg.includes('User already registered'))
    return 'Este email ya tiene una cuenta. Prueba a acceder.';
  if (msg.includes('Password should be'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('Unable to validate email address'))
    return 'El formato del email no es válido.';
  if (msg.includes('signup_disabled'))
    return 'El registro está desactivado temporalmente.';
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Error de conexión. Comprueba tu internet.';
  // Fallback: mostrar el error real de Supabase (útil para debug)
  return msg || 'Error al procesar la solicitud.';
}

// --- signup ---
export async function handleSignup(e) {
  e.preventDefault();
  const form     = e.target;
  const email    = form.email.value.trim();
  const password = form.password.value;
  const msg      = form.querySelector('.form-message');
  const btn      = form.querySelector('button[type="submit"]');

  clearMessage(msg);

  if (password.length < 8) {
    showMessage(msg, 'La contraseña debe tener al menos 8 caracteres.');
    return;
  }

  btn.disabled = true;
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
  btn.textContent = 'Creando cuenta...';

  const { data, error } = await supabase.auth.signUp({ email, password });

  btn.disabled = false;
  btn.textContent = btn.dataset.originalText;

  if (error) {
    showMessage(msg, translateError(error));
    return;
  }

  // Email confirmation OFF → sesión inmediata
  if (data.session) {
    window.location.href = '/confirmado.html';
    return;
  }

  // Email confirmation ON → pedir al usuario que confirme
  showMessage(
    msg,
    '✓ Cuenta creada. Revisa tu correo para confirmar tu cuenta.',
    'success'
  );
}

// --- login ---
export async function handleLogin(e) {
  e.preventDefault();
  const form     = e.target;
  const email    = form.email.value.trim();
  const password = form.password.value;
  const msg      = form.querySelector('.form-message');
  const btn      = form.querySelector('button[type="submit"]');

  clearMessage(msg);

  btn.disabled = true;
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
  btn.textContent = 'Accediendo...';

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.textContent = btn.dataset.originalText;

  if (error) {
    showMessage(msg, translateError(error));
    return;
  }

  // Redirect: si venía de una compra (parámetro ?next=), volver ahí
  const params   = new URLSearchParams(window.location.search);
  const next     = params.get('next');
  window.location.href = next && next.startsWith('/') ? next : '/mi-cuenta';
}

// --- logout ---
export async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = '/';
}

// --- session helpers ---
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
