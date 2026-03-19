import { initReveal, initCursor } from './animations.js';
import { qs, qsa } from './utils.js';

function initNav() {
  const nav = qs('.nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });

  const toggle = qs('.nav__toggle');
  const mobile = qs('.nav__mobile');
  if (!toggle || !mobile) return;

  toggle.addEventListener('click', () => {
    const open = mobile.classList.toggle('active');
    nav.classList.toggle('menu-active', open);
    document.body.classList.toggle('menu-open', open);
  });

  mobile.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobile.classList.remove('active');
      nav.classList.remove('menu-active');
      document.body.classList.remove('menu-open');
    });
  });
}

function initFilter() {
  const buttons = qsa('.filter-btn');
  const cards = qsa('.blog-card[data-category]');
  const empty = qs('.blog-empty');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      let visible = 0;

      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('blog-card--hidden', !match);
        if (match) visible++;
      });

      if (empty) empty.classList.toggle('visible', visible === 0);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initCursor();
  initNav();
  initFilter();
});
