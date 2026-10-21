/* Progressive enhancement of the concept collection. No commerce or network writes. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const mobile = matchMedia('(max-width: 760px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function setMenu(open) {
    header.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.firstElementChild.textContent = open ? 'Cerrar' : 'Menú';
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.dataset.open === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (header.dataset.open === 'true' && !header.contains(event.target)) setMenu(false);
  });
  header.addEventListener('focusout', () => {
    requestAnimationFrame(() => {
      if (header.dataset.open === 'true' && !header.contains(document.activeElement)) setMenu(false);
    });
  });
  mobile.addEventListener('change', () => {
    const focusWasInNav = nav.contains(document.activeElement);
    setMenu(false);
    if (mobile.matches && focusWasInNav) toggle.focus();
  });

  const cards = [...document.querySelectorAll('.concept-card')];
  const note = document.querySelector('.collection-note');
  const filters = [...document.querySelectorAll('[data-filter]')];
  function filterCollection(category) {
    cards.forEach((card) => { card.hidden = category !== 'all' && card.dataset.category !== category; });
    note.hidden = category !== 'all';
    filters.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
    const count = cards.filter((card) => !card.hidden).length;
    document.querySelector('#result-count').textContent = `${count} MODELOS`;
  }
  filters.forEach((button) => button.addEventListener('click', () => filterCollection(button.dataset.filter)));

  function revealAnchor(target) {
    if (target.matches('.concept-card') && target.hidden) filterCollection('all');
    setMenu(false);
    target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  }
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      revealAnchor(target);
      history.replaceState(null, '', link.hash);
    });
  });
  window.addEventListener('hashchange', () => {
    const target = document.getElementById(location.hash.slice(1));
    if (target?.matches('.concept-card')) revealAnchor(target);
  });

  const concepts = [
    { id: 'miami', title: 'MIAMI RETRO', category: 'DS—01 / OVERSIZED', image: 'miami-retro', alt: 'Concepto Miami Retro: frente y espalda de la camiseta negra lavada con gráfica vintage de Miami', description: 'Una silueta amplia y una gráfica con memoria. Arquitectura, palmeras y cultura del hierro en la misma espalda.', specs: [['Silueta objetivo', 'Boxy oversized, hombro caído y largo completo'], ['Tejido objetivo', 'Heavyweight · 260–280 GSM'], ['Acabados previstos', 'Negro lavado. Bordado DS pequeño delante y estampado vintage grande detrás.']], status: 'Diseño previo a muestra. La muestra aún no está fabricada. Especificaciones pendientes de validación; prenda no disponible.' },
    { id: 'iron', title: 'IRON CULTURE', category: 'DS—02 / OVERSIZED', image: 'iron-culture', alt: 'Concepto Iron Culture: camiseta negra con DS delante y culturista, barra y discos detrás', description: 'Un homenaje al bodybuilding clásico. Una silueta amplia y una gráfica que lleva el lenguaje del gimnasio a la calle.', specs: [['Dirección', 'Oversized'], ['Identidad', 'DS en el pecho. Gráfica de culturista, barra y discos en la espalda.'], ['Paleta', 'Negro y tonos crema']], status: 'Concepto en desarrollo. Tejido, ajuste y acabados pendientes de validar en muestra. Prenda aún no disponible.' },
    { id: 'tonal', title: 'TONAL', category: 'DS—03 / COMPRESIÓN', image: 'tonal-anthracite', alt: 'Concepto Tonal: camiseta de compresión gris antracita con textura y monograma DS tonal', description: 'Textura visible. Color contenido. El monograma DS se integra en una camiseta de compresión en gris antracita.', specs: [['Dirección', 'Compresión'], ['Color de estudio', 'Gris antracita'], ['Identidad', 'Monograma DS tonal'], ['Base de estudio', 'DX7752']], status: 'Diseño en estudio. Tejido, ajuste y acabado pendientes de validación en muestra. Prenda aún no disponible.' },
    { id: 'anatomy-men', title: 'ANATOMY / HOMBRE', category: 'DS—04 / COMPRESIÓN', image: 'anatomy-men', alt: 'Visualización de concepto ANATOMY hombre: camiseta negra de compresión con monograma DS dorado', description: 'El cuerpo marca el trazo. La camiseta de compresión ANATOMY explora líneas anatómicas, negro profundo y el sello DS en dorado.', specs: [['Silueta de estudio', 'Camiseta de compresión'], ['Identidad', 'Negro y DS dorado'], ['Diseño', 'Frente y espalda en la lámina ANATOMY']], status: 'Visualización de concepto, no fotografía de una prenda fabricada. Ajuste, tejido y acabados pendientes de validar en muestra. Aún no disponible.', sheet: true },
    { id: 'anatomy-women', title: 'ANATOMY / MUJER', category: 'DS—05 / TOP + LEGGINGS', image: 'anatomy-women', alt: 'Visualización de concepto ANATOMY mujer: conjunto negro de top y leggings con monograma DS dorado', description: 'Top y leggings con una misma intención. La dirección ANATOMY traslada las líneas del cuerpo a un conjunto negro con identidad DS.', specs: [['Silueta de estudio', 'Conjunto de top y leggings'], ['Identidad', 'Negro y DS dorado'], ['Diseño', 'Frente y espalda en la lámina ANATOMY']], status: 'Visualización de concepto, no fotografía de prendas fabricadas. Ajuste, tejido y acabados pendientes de validar en muestra. Aún no disponible.', sheet: true }
  ];
  const dialog = document.querySelector('.concept-dialog');
  let conceptIndex = 0;
  let dialogTrigger = null;
  function renderConcept(index) {
    conceptIndex = (index + concepts.length) % concepts.length;
    const concept = concepts[conceptIndex];
    const image = document.querySelector('#dialog-image');
    image.loading = 'eager';
    image.src = `assets/images/editorial/${concept.image}.webp`;
    image.alt = concept.alt;
    document.querySelector('#dialog-original').href = `assets/images/collection/${concept.image}.png`;
    document.querySelector('#dialog-title').textContent = concept.title;
    document.querySelector('#dialog-category').textContent = concept.category;
    document.querySelector('#dialog-description').textContent = concept.description;
    document.querySelector('#dialog-status').textContent = concept.status;
    document.querySelector('#dialog-sheet').hidden = !concept.sheet;
    document.querySelector('#dialog-position').textContent = `${String(conceptIndex + 1).padStart(2, '0')} / 05`;
    document.querySelector('#dialog-announcement').textContent = `${concept.title}. Concepto ${conceptIndex + 1} de 5.`;
    const specs = document.querySelector('#dialog-specs');
    specs.replaceChildren(...concept.specs.map(([term, value]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = term;
      dd.textContent = value;
      row.append(dt, dd);
      return row;
    }));
    dialog.scrollTop = 0;
  }
  document.querySelectorAll('[data-concept]').forEach((link) => {
    link.addEventListener('click', (event) => {
      // The original image remains usable without JavaScript or dialog support.
      if (typeof dialog.showModal !== 'function' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const index = concepts.findIndex((concept) => concept.id === link.dataset.concept);
      if (index < 0) return;
      event.preventDefault();
      dialogTrigger = link;
      renderConcept(index);
      dialog.showModal();
      document.body.classList.add('dialog-open');
      dialog.querySelector('.dialog-close').focus();
    });
  });
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.dialog-prev').addEventListener('click', () => renderConcept(conceptIndex - 1));
  dialog.querySelector('.dialog-next').addEventListener('click', () => renderConcept(conceptIndex + 1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button, a[href]')]
      .filter((control) => !control.disabled && control.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    dialogTrigger?.focus({ preventScroll: true });
  });
  document.querySelector('#year').textContent = new Date().getFullYear();
})();
