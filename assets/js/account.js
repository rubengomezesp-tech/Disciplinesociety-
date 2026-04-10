// assets/js/account.js
// Phase 2 + Phase 3 — Profile page with order history
import { supabase } from './supabase-client.js';
import { handleLogout } from './auth.js';

// --- helpers ---
function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatPrice(amount, currency = 'eur') {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${Number(amount).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function statusLabel(status) {
  const map = {
    paid: 'Pagado',
    pending: 'Pendiente',
    refunded: 'Reembolsado',
    failed: 'Fallido',
  };
  return map[status] || status || '—';
}

// --- render orders ---
function renderOrders(container, orders) {
  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="placeholder">
        <div class="tag">Vacío</div>
        <p>Aún no tienes pedidos registrados.</p>
      </div>
    `;
    return;
  }

  const rows = orders
    .map(
      (o) => `
      <article class="order-item">
        <div class="order-head">
          <div class="order-name">${escapeHtml(o.product_name || 'Pedido')}</div>
          <div class="order-amount">${formatPrice(o.amount, o.currency)}</div>
        </div>
        <div class="order-meta">
          <span class="order-date">${formatDate(o.created_at)}</span>
          <span class="order-status order-status--${escapeHtml(o.status || 'paid')}">${statusLabel(o.status)}</span>
        </div>
      </article>
    `
    )
    .join('');

  container.innerHTML = `<div class="orders-list">${rows}</div>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

// --- load orders for current user ---
async function loadOrders(userId) {
  const container = document.getElementById('orders-container');
  if (!container) return;

  const { data, error } = await supabase
    .from('orders')
    .select('id, product_name, amount, currency, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading orders:', error);
    container.innerHTML = `
      <div class="placeholder">
        <div class="tag">Error</div>
        <p>No se pudieron cargar tus pedidos. Inténtalo más tarde.</p>
      </div>
    `;
    return;
  }

  renderOrders(container, data);
}

// --- init ---
async function init() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.replace('/acceder');
    return;
  }

  const user = session.user;

  // Profile fields
  const emailEl = document.getElementById('user-email');
  const dateEl = document.getElementById('user-created');
  if (emailEl) emailEl.textContent = user.email || '—';
  if (dateEl) dateEl.textContent = formatDate(user.created_at);

  // Reveal content
  document.body.classList.add('is-ready');

  // Load orders
  loadOrders(user.id);

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      logoutBtn.disabled = true;
      logoutBtn.textContent = 'Cerrando...';
      await handleLogout();
    });
  }

  // Cross-tab sign-out
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      window.location.replace('/acceder');
    }
  });
}

init();
