import {
  initReveal,
  initCursor,
  initMagnetic,
  initCardShine,
  initParallax,
} from './animations.js';
import { qs, throttle, initBackCacheRecovery, initSmartBack } from './utils.js';

function initTheme() {
  const root = document.documentElement;
  const toggle = qs('#theme-toggle');
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener?.('change', e => {
    if (!localStorage.getItem('theme')) {
      root.setAttribute('data-theme', e.matches ? 'light' : 'dark');
    }
  });
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch {}
  });
}

function initNav() {
  const nav = qs('.nav');
  if (!nav) return;
  const onScroll = throttle(() => {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  }, 80);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initReveal();
  initCursor();
  initNav();
  initMagnetic();
  initCardShine();
  initParallax();
  initBackCacheRecovery();
  initSmartBack();
});
