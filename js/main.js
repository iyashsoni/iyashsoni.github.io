import {
  initReveal,
  initCursor,
  initMagnetic,
  initCardShine,
  initParallax,
  initReadProgress,
} from './animations.js';
import { qs, qsa, throttle, initBackCacheRecovery, initSmartBack } from './utils.js';

/* ── Theme toggle ────────────────────────────────── */
function initTheme() {
  const root = document.documentElement;
  const toggle = qs('#theme-toggle');

  // System change listener (only when user hasn't pinned a theme)
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

/* ── Glass nav scroll state + mobile menu ───────── */
function initNav() {
  const nav = qs('.nav');
  if (!nav) return;

  const onScroll = throttle(() => {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  }, 80);

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = qs('.nav__toggle');
  const mobile = qs('.nav__mobile');
  if (!toggle || !mobile) return;

  toggle.addEventListener('click', () => {
    const open = mobile.classList.toggle('active');
    nav.classList.toggle('menu-active', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  mobile.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobile.classList.remove('active');
      nav.classList.remove('menu-active');
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ── Hero typewriter ─────────────────────────────── */
function initTypewriter() {
  const el = qs('#typewriter');
  if (!el) return;

  const phrases = [
    'Engineer. Thinker. Seeker.',
    'Spearheading COS at IBM.',
    'From Ahmedabad to Bangalore.',
    'Chasing markets, music & meaning.',
    'IIIT-B MTech · 10 years in tech.',
    'Curious about everything.',
  ];

  const cursor = document.createElement('span');
  cursor.className = 'cursor-blink';
  el.insertAdjacentElement('afterend', cursor);

  let pi = 0, ci = 0, deleting = false;

  function type() {
    const phrase = phrases[pi];
    if (deleting) {
      el.textContent = phrase.slice(0, --ci);
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        setTimeout(type, 480);
        return;
      }
      setTimeout(type, 32);
    } else {
      el.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) {
        deleting = true;
        setTimeout(type, 2400);
        return;
      }
      setTimeout(type, 62);
    }
  }
  setTimeout(type, 900);
}

/* ── Smooth scroll for in-page anchors ──────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ── Section spy (highlights nav links) ─────────── */
function initSectionSpy() {
  const sections = qsa('section[id]');
  const links = qsa('.nav__links a[href^="#"]');
  if (!sections.length || !links.length) return;

  const map = new Map();
  links.forEach(l => {
    const id = l.getAttribute('href').slice(1);
    if (id) map.set(id, l);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = map.get(id);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('is-active'));
        link.classList.add('is-active');
      }
    });
  }, { rootMargin: '-50% 0px -45% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

/* ── Avatar fallback ─────────────────────────────── */
function initPhotoFallback() {
  const photo = document.querySelector('.avatar-frame img, .about__photo');
  if (!photo) return;
  photo.addEventListener('error', () => {
    const f = photo.closest('.avatar-frame, .about__photo-frame');
    if (f) f.classList.add('no-photo');
  });
}

/* ── Bootstrap ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initReveal();
  initCursor();
  initNav();
  initTypewriter();
  initSmoothScroll();
  initSectionSpy();
  initMagnetic();
  initCardShine();
  initParallax();
  initReadProgress();
  initPhotoFallback();
  initBackCacheRecovery();
  initSmartBack();
});
