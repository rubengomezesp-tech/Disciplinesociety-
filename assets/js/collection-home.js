// Local collection lookbook: navigation only. No commerce or subscription requests.
(() => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const label = toggle.querySelector('.menu-label');
  const mobile = window.matchMedia('(max-width: 760px)');

  function setMenu(open) {
    header.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Cerrar' : 'Menú';
  }

  toggle.addEventListener('click', () => {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.dataset.open === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      setMenu(false);
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
      target.focus({ preventScroll: true });
      history.replaceState(null, '', link.hash);
    });
  });

  mobile.addEventListener('change', () => {
    const focusWasInNav = header.querySelector('.main-nav').contains(document.activeElement);
    setMenu(false);
    if (mobile.matches && focusWasInNav) toggle.focus();
  });
})();
