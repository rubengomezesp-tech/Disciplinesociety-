// assets/js/auth.js
import { supabase } from './supabase-client.js';

// ─── helpers ─────────────────────────────────────────────────────────────────

function showMsg(el, text, type = 'error') {
  if (!el) return;
  el.textContent = text;
  el.className = `form-message ${type}`;
  el.style.display = 'block';
}
function clearMsg(el) {
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

function translateError(error) {
  if (!error) return 'Error desconocido.';
  const msg = error.message || '';
  if (msg.includes('Email not confirmed'))
    return 'Confirma tu correo antes de acceder. Revisa también el spam.';
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials'))
    return 'Email o contraseña incorrectos.';
  if (msg.includes('Email rate limit') || msg.includes('over_email_send_rate_limit'))
    return 'Demasiados intentos. Espera unos minutos.';
  if (msg.includes('User already registered'))
    return 'Este email ya tiene cuenta. Prueba a acceder.';
  if (msg.includes('Password should be'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('Unable to validate email address') || msg.includes('invalid email'))
    return 'El formato del email no es válido.';
  if (msg.includes('signup_disabled'))
    return 'El registro está temporalmente desactivado.';
  if (msg.includes('Failed to fetch') || msg.includes('network'))
    return 'Error de conexión. Comprueba tu internet.';
  if (msg.includes('Token has expired') || msg.includes('token'))
    return 'El enlace ha expirado. Solicita uno nuevo.';
  return msg || 'Error al procesar la solicitud.';
}

// ─── signup ──────────────────────────────────────────────────────────────────

export async function handleSignup(e) {
  e.preventDefault();
  const form     = e.target;
  const email    = form.email.value.trim();
  const password = form.password.value;
  const msg      = form.querySelector('.form-message');
  const btn      = form.querySelector('button[type="submit"]');
  clearMsg(msg);
  if (password.length < 8) { showMsg(msg, 'La contraseña debe tener al menos 8 caracteres.'); return; }
  btn.disabled = true;
  const orig = btn.dataset.orig || btn.textContent;
  btn.dataset.orig = orig;
  btn.textContent = 'Creando cuenta...';
  const { data, error } = await supabase.auth.signUp({ email, password });
  btn.disabled = false;
  btn.textContent = orig;
  if (error) { showMsg(msg, translateError(error)); return; }
  if (data.session) { window.location.href = '/confirmado.html'; return; }
  showMsg(msg, '✓ Cuenta creada. Revisa tu correo para confirmarla. Mira también el spam.', 'success');
}

// ─── login ───────────────────────────────────────────────────────────────────

export async function handleLogin(e) {
  e.preventDefault();
  const form     = e.target;
  const email    = form.email.value.trim();
  const password = form.password.value;
  const msg      = form.querySelector('.form-message');
  const btn      = form.querySelector('button[type="submit"]');
  clearMsg(msg);
  btn.disabled = true;
  const orig = btn.dataset.orig || btn.textContent;
  btn.dataset.orig = orig;
  btn.textContent = 'Accediendo...';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  btn.textContent = orig;
  if (error) { showMsg(msg, translateError(error)); return; }
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');
  window.location.href = (next && next.startsWith('/')) ? next : '/mi-cuenta.html';
}

// ─── forgot password ─────────────────────────────────────────────────────────

export async function handleForgotPassword(e) {
  e.preventDefault();
  const form  = e.target;
  const email = form.email.value.trim();
  const msg   = form.querySelector('.form-message') || document.getElementById('recover-msg');
  const btn   = form.querySelector('button[type="submit"]') || document.getElementById('recover-btn');
  if (!email) { showMsg(msg, 'Introduce tu correo.'); return; }
  btn.disabled = true;
  const orig = btn.dataset.orig || btn.textContent;
  btn.dataset.orig = orig;
  btn.textContent = 'Enviando...';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://disciplinesociety.net/nueva-contrasena.html',
  });
  btn.disabled = false;
  btn.textContent = orig;
  if (error) { showMsg(msg, translateError(error)); return; }
  showMsg(msg, '✓ Si ese email está registrado recibirás el enlace en unos minutos. Revisa el spam.', 'success');
  form.email.value = '';
}

// ─── logout ──────────────────────────────────────────────────────────────────

export async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = '/';
}

// ─── helpers ─────────────────────────────────────────────────────────────────

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
