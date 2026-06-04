import { supabase } from './supabase-client.js';
import {
  SITE_IMAGE_BUCKET,
  SITE_IMAGE_SLOTS,
  imageForSlot,
  loadSiteImageOverrides,
  normalizeImageUrl,
  slugifyFileName,
} from './site-images.js';

const state = {
  user: null,
  overrides: new Map(),
};

const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const deniedView = document.getElementById('denied-view');
const loginForm = document.getElementById('admin-login-form');
const loginMessage = document.getElementById('login-message');
const adminEmail = document.getElementById('admin-email');
const deniedMessage = document.getElementById('denied-message');
const slotsGrid = document.getElementById('slots-grid');
const refreshBtn = document.getElementById('refresh-btn');
const logoutBtn = document.getElementById('logout-btn');
const globalMessage = document.getElementById('global-message');

init();

async function init() {
  loginForm.addEventListener('submit', handleLogin);
  refreshBtn.addEventListener('click', loadAdmin);
  logoutBtn.addEventListener('click', handleLogout);

  const { data: { session } } = await supabase.auth.getSession();
  await routeSession(session);

  supabase.auth.onAuthStateChange((_event, session) => {
    routeSession(session);
  });
}

async function routeSession(session) {
  state.user = session && session.user ? session.user : null;

  if (!state.user) {
    showView('login');
    return;
  }

  const allowed = await isAdmin(state.user.id);
  if (!allowed) {
    showView('denied');
    return;
  }

  await loadAdmin();
}

async function isAdmin(userId) {
  const { data, error } = await supabase
    .from('site_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    showMessage(deniedMessage, 'Configura primero sql/admin-images.sql en Supabase.', 'error');
    return false;
  }

  showMessage(deniedMessage, 'Tu usuario no esta en la tabla site_admins.', 'error');
  return Boolean(data);
}

async function loadAdmin() {
  showView('admin');
  adminEmail.textContent = state.user.email || 'Admin';
  showMessage(globalMessage, 'Cargando imagenes...', 'info');

  state.overrides = await loadSiteImageOverrides(supabase);
  renderSlots();
  showMessage(globalMessage, 'Listo.', 'success');
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const email = form.email.value.trim();
  const password = form.password.value;
  const button = form.querySelector('button[type="submit"]');

  showMessage(loginMessage, '', '');
  button.disabled = true;
  button.textContent = 'Entrando...';

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  button.disabled = false;
  button.textContent = 'Entrar';

  if (error) {
    showMessage(loginMessage, translateAuthError(error), 'error');
  }
}

async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

function renderSlots() {
  slotsGrid.innerHTML = '';

  SITE_IMAGE_SLOTS.forEach((slot) => {
    const image = imageForSlot(slot, state.overrides);
    const card = document.createElement('article');
    card.className = 'image-card';
    card.dataset.slot = slot.slot;

    card.innerHTML = `
      <div class="image-card__media">
        <img src="${escapeAttr(image.src)}" alt="${escapeAttr(image.alt)}" loading="lazy">
      </div>
      <div class="image-card__body">
        <div class="image-card__meta">
          <span>${escapeHtml(slot.section)}</span>
          <strong>${escapeHtml(slot.label)}</strong>
        </div>
        <label>
          <span>URL</span>
          <input type="url" name="image_url" value="${escapeAttr(image.src)}" autocomplete="off">
        </label>
        <label>
          <span>Alt</span>
          <input type="text" name="alt" value="${escapeAttr(image.alt)}" autocomplete="off">
        </label>
        <label class="file-row">
          <span>Archivo</span>
          <input type="file" name="file" accept="image/jpeg,image/png,image/webp">
        </label>
        <div class="image-card__actions">
          <button type="button" data-action="save">Guardar</button>
          <button type="button" data-action="upload">Subir</button>
          <button type="button" data-action="reset">Reset</button>
        </div>
        <p class="card-message" aria-live="polite"></p>
      </div>
    `;

    card.querySelector('[data-action="save"]').addEventListener('click', () => saveCard(card, slot));
    card.querySelector('[data-action="upload"]').addEventListener('click', () => uploadCard(card, slot));
    card.querySelector('[data-action="reset"]').addEventListener('click', () => resetSlot(card, slot));
    card.querySelector('input[name="image_url"]').addEventListener('input', (event) => {
      const url = normalizeImageUrl(event.target.value);
      if (url) card.querySelector('img').src = url;
    });

    slotsGrid.appendChild(card);
  });
}

async function saveCard(card, slot) {
  const urlInput = card.querySelector('input[name="image_url"]');
  const altInput = card.querySelector('input[name="alt"]');
  const message = card.querySelector('.card-message');
  const imageUrl = normalizeImageUrl(urlInput.value);

  if (!imageUrl) {
    showMessage(message, 'URL no valida.', 'error');
    return;
  }

  await saveSlot(slot, imageUrl, altInput.value.trim() || slot.alt, message);
}

async function uploadCard(card, slot) {
  const fileInput = card.querySelector('input[name="file"]');
  const altInput = card.querySelector('input[name="alt"]');
  const urlInput = card.querySelector('input[name="image_url"]');
  const message = card.querySelector('.card-message');
  const file = fileInput.files && fileInput.files[0];

  if (!file) {
    showMessage(message, 'Selecciona un archivo.', 'error');
    return;
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    showMessage(message, 'Formato no permitido.', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showMessage(message, 'Maximo 5 MB.', 'error');
    return;
  }

  showMessage(message, 'Subiendo...', 'info');

  const path = `${slot.slot}/${Date.now()}-${slugifyFileName(file.name)}.${extensionFor(file)}`;
  const { error: uploadError } = await supabase.storage
    .from(SITE_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    showMessage(message, uploadError.message || 'No se pudo subir.', 'error');
    return;
  }

  const { data } = supabase.storage.from(SITE_IMAGE_BUCKET).getPublicUrl(path);
  const publicUrl = data && data.publicUrl;

  if (!publicUrl) {
    showMessage(message, 'No se pudo leer la URL publica.', 'error');
    return;
  }

  urlInput.value = publicUrl;
  card.querySelector('img').src = publicUrl;
  await saveSlot(slot, publicUrl, altInput.value.trim() || slot.alt, message);
  fileInput.value = '';
}

async function saveSlot(slot, imageUrl, alt, message) {
  showMessage(message, 'Guardando...', 'info');

  const { error } = await supabase.from('site_images').upsert({
    slot: slot.slot,
    section: slot.section,
    label: slot.label,
    image_url: imageUrl,
    alt,
    updated_by: state.user.id,
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'slot',
  });

  if (error) {
    showMessage(message, error.message || 'No se pudo guardar.', 'error');
    return;
  }

  state.overrides = await loadSiteImageOverrides(supabase);
  showMessage(message, 'Guardado.', 'success');
}

async function resetSlot(card, slot) {
  const message = card.querySelector('.card-message');
  showMessage(message, 'Restaurando...', 'info');

  const { error } = await supabase
    .from('site_images')
    .delete()
    .eq('slot', slot.slot);

  if (error) {
    showMessage(message, error.message || 'No se pudo restaurar.', 'error');
    return;
  }

  state.overrides.delete(slot.slot);
  const image = imageForSlot(slot, state.overrides);
  card.querySelector('img').src = image.src;
  card.querySelector('img').alt = image.alt;
  card.querySelector('input[name="image_url"]').value = image.src;
  card.querySelector('input[name="alt"]').value = image.alt;
  showMessage(message, 'Restaurado.', 'success');
}

function showView(name) {
  loginView.hidden = name !== 'login';
  adminView.hidden = name !== 'admin';
  deniedView.hidden = name !== 'denied';
  logoutBtn.hidden = name === 'login';
  adminEmail.hidden = name === 'login';
}

function showMessage(element, text, type) {
  if (!element) return;
  element.textContent = text;
  element.className = type ? `message ${type}` : 'message';
}

function translateAuthError(error) {
  const message = error && error.message ? error.message : '';
  if (message.includes('Invalid login credentials')) return 'Email o contrasena incorrectos.';
  if (message.includes('Email not confirmed')) return 'Confirma tu correo antes de entrar.';
  return message || 'No se pudo entrar.';
}

function extensionFor(file) {
  const byType = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return byType[file.type] || 'jpg';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
