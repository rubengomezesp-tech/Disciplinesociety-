export const SITE_IMAGE_BUCKET = 'site-images';

export const SITE_IMAGE_SLOTS = [
  {
    slot: 'brand.logo',
    section: 'Marca',
    label: 'Logo principal',
    fallback: 'ds-logo.png',
    alt: 'Discipline Society',
    targetSelector: '[data-site-image="brand.logo"]',
  },
  {
    slot: 'product.tee.black.0',
    section: 'DS Core Tee',
    label: 'Negro',
    fallback: 'tee-black.jpg',
    alt: 'DS Core Tee · Negro',
    targetSelector: '[data-site-image="product.tee.black.0"]',
    product: 'tee',
    color: 'black',
    index: 0,
  },
  {
    slot: 'product.tee.sand.0',
    section: 'DS Core Tee',
    label: 'Arena',
    fallback: 'tee-sand.jpg',
    alt: 'DS Core Tee · Arena',
    targetSelector: '[data-site-image="product.tee.sand.0"]',
    product: 'tee',
    color: 'sand',
    index: 0,
  },
  {
    slot: 'product.tracksuit.black.0',
    section: 'DS Tracksuit',
    label: 'Principal',
    fallback: 'tracksuit.jpg',
    alt: 'DS Tracksuit · Conjunto completo',
    targetSelector: '[data-site-image="product.tracksuit.black.0"]',
    product: 'tracksuit',
    color: 'black',
    index: 0,
  },
  {
    slot: 'product.tracksuit.black.1',
    section: 'DS Tracksuit',
    label: 'Detalle',
    fallback: 'tracksuit-detail.jpg',
    alt: 'DS Tracksuit · Detalle bordado',
    targetSelector: '[data-site-image="product.tracksuit.black.1"]',
    product: 'tracksuit',
    color: 'black',
    index: 1,
  },
  {
    slot: 'product.hoodie.black.0',
    section: 'Hoodie EYP',
    label: 'Principal',
    fallback: 'hoodie.jpg',
    alt: 'Hoodie Earn Your Place',
    targetSelector: '[data-site-image="product.hoodie.black.0"]',
    product: 'hoodie',
    color: 'black',
    index: 0,
  },
  {
    slot: 'product.hoodie.black.1',
    section: 'Hoodie EYP',
    label: 'Detalle',
    fallback: 'hoodie2.jpg',
    alt: 'Hoodie Earn Your Place',
    targetSelector: '[data-site-image="product.hoodie.black.1"]',
    product: 'hoodie',
    color: 'black',
    index: 1,
  },
];

export const SITE_IMAGE_SLOT_MAP = new Map(
  SITE_IMAGE_SLOTS.map((slot) => [slot.slot, slot])
);

export async function loadSiteImageOverrides(supabase) {
  try {
    const { data, error } = await supabase
      .from('site_images')
      .select('slot, image_url, alt, updated_at')
      .in('slot', SITE_IMAGE_SLOTS.map((slot) => slot.slot));

    if (error) return new Map();

    return new Map(
      (data || [])
        .filter((row) => SITE_IMAGE_SLOT_MAP.has(row.slot))
        .map((row) => [row.slot, row])
    );
  } catch {
    return new Map();
  }
}

export function imageForSlot(slot, overrides) {
  const config = typeof slot === 'string' ? SITE_IMAGE_SLOT_MAP.get(slot) : slot;
  if (!config) return null;

  const override = overrides && overrides.get(config.slot);
  const src = normalizeImageUrl(override && override.image_url) || config.fallback;
  const alt = (override && override.alt) || config.alt;

  return {
    ...config,
    src,
    alt,
    updatedAt: override && override.updated_at,
    isOverride: Boolean(override && normalizeImageUrl(override.image_url)),
  };
}

export function applyDocumentImageOverrides(overrides) {
  SITE_IMAGE_SLOTS
    .filter((slot) => slot.targetSelector)
    .forEach((slot) => {
      const image = imageForSlot(slot, overrides);
      if (!image) return;

      document.querySelectorAll(slot.targetSelector).forEach((img) => {
        img.src = image.src;
        img.alt = image.alt;
      });
    });
}

export function applyProductImageOverrides(catalog, overrides) {
  SITE_IMAGE_SLOTS
    .filter((slot) => slot.product && slot.color)
    .forEach((slot) => {
      const image = imageForSlot(slot, overrides);
      const colorConfig = catalog[slot.product]?.colors?.[slot.color];
      if (!image || !colorConfig) return;

      colorConfig.images[slot.index] = {
        src: image.src,
        alt: image.alt,
      };
    });
}

export function normalizeImageUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';

    if (parsed.origin === window.location.origin) {
      return parsed.pathname + parsed.search + parsed.hash;
    }

    return parsed.href;
  } catch {
    return '';
  }
}

export function slugifyFileName(name) {
  const clean = String(name || 'image')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return clean || 'image';
}
