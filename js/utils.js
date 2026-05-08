export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = (fn, limit) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= limit) { last = now; fn(...args); }
  };
};

export const qs = (sel, ctx = document) => ctx.querySelector(sel);
export const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── Back-cache resilience ─────────────────────────
   Re-show reveal elements when a page is restored from bfcache,
   and ensure menu state is reset.                          */
export function initBackCacheRecovery() {
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    document.querySelectorAll('.nav__mobile.active').forEach(el => el.classList.remove('active'));
    document.body.classList.remove('menu-open');
    document.querySelectorAll('.nav.menu-active').forEach(el => el.classList.remove('menu-active'));
    document.querySelectorAll('.nav__toggle').forEach(t => t.setAttribute('aria-expanded', 'false'));
  });
}

/* ── Smart back link ────────────────────────────────
   If the user arrived from the very page this link targets,
   prefer history.back() so they keep their scroll position
   (and any bfcache state). Otherwise let the link navigate.
   Apply by adding [data-smart-back].                       */
export function initSmartBack() {
  document.querySelectorAll('[data-smart-back]').forEach(link => {
    link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
      try {
        if (!document.referrer) return;
        const ref = new URL(document.referrer);
        if (ref.origin !== window.location.origin) return;
        const target = new URL(link.getAttribute('href') || '/', window.location.origin);
        if (ref.pathname === target.pathname) {
          e.preventDefault();
          history.back();
        }
      } catch {}
    });
  });
}
