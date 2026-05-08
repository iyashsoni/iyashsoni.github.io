import { qsa } from './utils.js';

/* ── Reveal on scroll ────────────────────────────── */
export function initReveal() {
  const els = qsa('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  els.forEach(el => observer.observe(el));
}

export function revealElements(els) {
  if (!els.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  els.forEach(el => observer.observe(el));
}

/* ── Custom cursor ───────────────────────────────── */
export function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursor = document.createElement('div');
  const dot = document.createElement('div');
  cursor.className = 'cursor';
  dot.className = 'cursor__dot';
  document.body.append(cursor, dot);

  let mx = 0, my = 0;
  let cx = 0, cy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
  }, { passive: true });

  function frame() {
    cx += (mx - cx) * 0.16;
    cy += (my - cy) * 0.16;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(frame);
  }
  frame();

  qsa('a, button, .tile, .card, .blog-card, .cap').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
  });
}

/* ── Magnetic buttons ────────────────────────────── */
export function initMagnetic() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const els = qsa('.btn--magnetic');
  if (!els.length) return;

  const STRENGTH = 0.22;
  const RADIUS = 90;

  els.forEach(el => {
    let raf = null;
    let tx = 0, ty = 0;

    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(x, y);
      if (dist > RADIUS) return;
      tx = x * STRENGTH;
      ty = y * STRENGTH;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });
    });

    el.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = '';
    });
  });
}

/* ── Tilt + cursor shine on cards ───────────────── */
export function initCardShine() {
  const cards = qsa('.tile, .cap, .card, .blog-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 100;
      const my = ((e.clientY - r.top) / r.height) * 100;
      card.style.setProperty('--mx', `${mx}%`);
      card.style.setProperty('--my', `${my}%`);
    });
  });
}

/* ── Parallax orbs ───────────────────────────────── */
export function initParallax() {
  const orbs = qsa('.orb, .floats');
  if (!orbs.length) return;
  let ticking = false;

  function update() {
    const y = window.scrollY;
    orbs.forEach((el, i) => {
      const factor = (i + 1) * 0.04 + 0.05;
      el.style.transform = `translate3d(0, ${y * factor * (i % 2 === 0 ? -1 : 1)}px, 0)`;
    });
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

/* ── Reading progress bar ───────────────────────── */
export function initReadProgress() {
  const article = document.querySelector('.post-content');
  if (!article) return;

  const bar = document.createElement('div');
  bar.className = 'read-progress';
  bar.innerHTML = '<div class="read-progress__fill"></div>';
  document.body.appendChild(bar);
  const fill = bar.querySelector('.read-progress__fill');

  function update() {
    const r = article.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    const seen = Math.min(Math.max(-r.top, 0), Math.max(total, 1));
    const pct = (seen / Math.max(total, 1)) * 100;
    fill.style.setProperty('--p', `${pct}%`);
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}
