// assets/js/auth.js
// All authentication logic for Discipline Society — Phase 1
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

// --- signup ---
export async function handleSignup(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value.trim();
  const password = form.password.value;
  const msg = form.querySelector('.form-message');
  const btn = form.querySelector('button[type="submit"]');

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
    showMessage(msg, error.message);
    return;
  }

  // If email confirmation is OFF in Supabase, session exists immediately
  if (data.session) {
    window.location.href = '/';
  } else {
    showMessage(
      msg,
      'Revisa tu correo para confirmar tu cuenta.',
      'success'
    );
  }
}

// --- login ---
export async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value.trim();
  const password = form.password.value;
  const msg = form.querySelector('.form-message');
  const btn = form.querySelector('button[type="submit"]');

  clearMessage(msg);
  btn.disabled = true;
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
  btn.textContent = 'Accediendo...';

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.textContent = btn.dataset.originalText;

  if (error) {
    showMessage(msg, 'Credenciales incorrectas.');
    return;
  }

  window.location.href = '/';
}

// --- logout ---
export async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = '/';
}

// --- session helper (used in later phases) ---
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}
