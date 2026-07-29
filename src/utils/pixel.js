/**
 * Meta Pixel (Facebook Pixel) — Utility
 * ──────────────────────────────────────
 * Initialises the Meta Pixel script and provides helper functions
 * for standard e-commerce events.
 *
 * Pixel ID is read from VITE_META_PIXEL_ID env variable.
 */

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

let initialized = false;

/**
 * Inject the Meta Pixel base code into the page <head>.
 * Safe to call multiple times — only runs once.
 */
export const initPixel = () => {
  if (initialized || !PIXEL_ID) return;

  // Standard Meta Pixel snippet (minified)
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');

  // Add noscript fallback image
  const noscript = document.createElement('noscript');
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.body.appendChild(noscript);

  initialized = true;
};

/* ─── Helper: safe fbq call ─────────────────────────────────────────────────── */
const track = (event, data) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, data);
  }
};

/* ─── Standard Events ───────────────────────────────────────────────────────── */

/** Fire on every route change */
export const trackPageView = () => track('PageView');

/** Fire when a visitor views a product detail page */
export const trackViewContent = (product) => {
  track('ViewContent', {
    content_name: product.name,
    content_ids: [product._id || product.id],
    content_type: 'product',
    value: product.price,
    currency: 'PKR',
  });
};

/** Fire when a visitor adds an item to their cart */
export const trackAddToCart = (product, quantity = 1) => {
  track('AddToCart', {
    content_name: product.name,
    content_ids: [product._id || product.id],
    content_type: 'product',
    value: product.price * quantity,
    currency: 'PKR',
    num_items: quantity,
  });
};

/** Fire when a visitor reaches the checkout page */
export const trackInitiateCheckout = (items, totalValue) => {
  track('InitiateCheckout', {
    content_ids: items.map(i => i._id || i.id),
    content_type: 'product',
    value: totalValue,
    currency: 'PKR',
    num_items: items.length,
  });
};

/** Fire when a purchase is successfully completed */
export const trackPurchase = (orderNumber, items, totalValue) => {
  track('Purchase', {
    content_ids: items.map(i => i._id || i.id || i.product),
    content_type: 'product',
    value: totalValue,
    currency: 'PKR',
    num_items: items.length,
    order_id: orderNumber,
  });
};

/** Fire when a visitor searches for products */
export const trackSearch = (searchQuery) => {
  track('Search', { search_string: searchQuery });
};

/** Fire on Contact page or form submission */
export const trackContact = () => track('Contact');

/** Fire on registration */
export const trackCompleteRegistration = () => {
  track('CompleteRegistration', { status: true });
};
