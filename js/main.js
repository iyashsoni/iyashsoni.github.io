import { initReveal, initCursor } from './animations.js';
import { qs, throttle } from './utils.js';

function initNav() {
  const nav = qs('.nav');
  if (!nav) return;

  const onScroll = throttle(() => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }, 100);

  window.addEventListener('scroll', onScroll, { passive: true });

  const toggle = qs('.nav__toggle');
  const mobile = qs('.nav__mobile');
  if (!toggle || !mobile) return;

  toggle.addEventListener('click', () => {
    const open = mobile.classList.toggle('active');
    nav.classList.toggle('menu-active', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
  });

  mobile.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobile.classList.remove('active');
      nav.classList.remove('menu-active');
      document.body.classList.remove('menu-open');
    });
  });
}

function initTypewriter() {
  const el = qs('#typewriter');
  if (!el) return;

  const phrases = [
    'Engineer. Thinker. Seeker.',
    'Spearheading COS at IBM.',
    'From Ahmedabad to Bangalore.',
    'Chasing markets, music & meaning.',
    'IIIT-B MTech · 10 years in tech.',
    'Curious about everything under the sun.',
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
        setTimeout(type, 500);
        return;
      }
      setTimeout(type, 40);
    } else {
      el.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) {
        deleting = true;
        setTimeout(type, 2200);
        return;
      }
      setTimeout(type, 75);
    }
  }

  setTimeout(type, 800);
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function initPhotoFallback() {
  const photo = document.querySelector('.about__photo');
  if (!photo) return;
  photo.addEventListener('error', () => {
    photo.closest('.about__photo-frame').classList.add('no-photo');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initCursor();
  initNav();
  initTypewriter();
  initSmoothScroll();
  initPhotoFallback();
});
