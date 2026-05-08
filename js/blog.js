import {
  initReveal,
  revealElements,
  initCursor,
  initMagnetic,
  initCardShine,
  initReadProgress,
  initParallax,
} from './animations.js';
import { qs, qsa, throttle } from './utils.js';

const MEDIUM_RSS_PROXY =
  'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fmedium.com%2Ffeed%2F%40iyashsoni';

const DEVTO_RSS_PROXY =
  'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fdev.to%2Ffeed%2Fiyashsoni';

/* ── Theme toggle (matches portfolio) ───────────── */
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
    });
  });
}

function applyFilter(filter) {
  const cards = qsa('[data-category]');
  const empty = qs('.blog-empty');
  let visible = 0;

  cards.forEach(card => {
    const match = filter === 'all' || card.dataset.category === filter;
    card.classList.toggle('blog-card--hidden', !match);
    if (match && card.classList.contains('blog-card')) visible++;
  });

  if (empty) empty.classList.toggle('visible', visible === 0);
}

function initFilter() {
  const buttons = qsa('.filter-btn');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });
}

function initExternalNavTab(navId, mobileId, filter) {
  ['#' + navId, '#' + mobileId]
    .map(id => document.querySelector(id))
    .filter(Boolean)
    .forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        const btn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
        if (btn) btn.click();
        window.scrollTo({
          top: (document.querySelector('.blog-filters')?.offsetTop ?? 0) - 80,
          behavior: 'smooth'
        });
      });
    });
}

function buildLocalCard(post) {
  const cat   = post.category;
  const label = cat.charAt(0).toUpperCase() + cat.slice(1);
  const article = document.createElement('article');
  article.className = 'blog-card reveal';
  article.dataset.category = cat;
  article.setAttribute('role', 'listitem');
  article.innerHTML = `
    <a href="${post.url}" style="display:contents">
      <div class="blog-card__meta">
        <span class="blog-card__category blog-card__category--${cat}">${label}</span>
        <span class="blog-card__date">${post.dateDisplay}</span>
      </div>
      <h2 class="blog-card__title">${post.title}</h2>
      <p class="blog-card__excerpt">${post.excerpt}</p>
      <span class="blog-card__read">${post.readTime}</span>
    </a>
  `;
  return article;
}

async function loadLocalPosts() {
  const grid = qs('.blog-grid');
  if (!grid) return;

  const category = grid.dataset.localCategory;
  if (!category) return;

  try {
    const res = await fetch('/blog/posts.json');
    if (!res.ok) return;
    const allPosts = await res.json();

    const filtered = category === 'all'
      ? allPosts
      : allPosts.filter(p => p.category === category);

    if (!filtered.length) return;

    const empty = qs('.blog-empty');
    const cards = filtered.map(buildLocalCard);
    const frag  = document.createDocumentFragment();
    cards.forEach(c => frag.appendChild(c));
    grid.insertBefore(frag, empty ?? grid.firstChild);
    revealElements(cards);

    const activeBtn = qs('.filter-btn.active');
    if (activeBtn) applyFilter(activeBtn.dataset.filter);
  } catch { /* posts.json absent — skip */ }
}

function formatDate(pubDate) {
  const d = new Date(pubDate);
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function extractText(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || '').replace(/\s+/g, ' ').trim();
}

function estimateReadTime(text) {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

function buildExternalCard(item, kind) {
  const text = extractText(item.description || item.content || '');
  const excerpt = text.length > 200 ? text.slice(0, 200).trimEnd() + '…' : text;
  const readMins = estimateReadTime(text);
  const date = formatDate(item.pubDate);
  const label = kind === 'medium' ? 'Medium' : 'Dev.to';

  const article = document.createElement('article');
  article.className = 'blog-card reveal';
  article.dataset.category = kind;
  article.setAttribute('role', 'listitem');
  article.innerHTML = `
    <a href="${item.link}" target="_blank" rel="noopener noreferrer" style="display:contents">
      <div class="blog-card__meta">
        <span class="blog-card__category blog-card__category--${kind}">${label}</span>
        <span class="blog-card__date">${date}</span>
      </div>
      <h2 class="blog-card__title">${item.title}</h2>
      <p class="blog-card__excerpt">${excerpt}</p>
      <span class="blog-card__read">↗ ${readMins} min read</span>
    </a>
  `;
  return article;
}

async function fetchExternalFeed(url, kind, profileUrl, profileLabel) {
  const grid = qs('.blog-grid');
  const empty = qs('.blog-empty');
  if (!grid) return;

  const loader = document.createElement('div');
  loader.id = `${kind}-loader`;
  loader.dataset.category = kind;
  loader.className = 'medium-loader';
  loader.textContent = `Loading articles from ${kind === 'medium' ? 'Medium' : 'Dev.to'}…`;
  grid.insertBefore(loader, empty);

  const activeFilter = qs('.filter-btn.active')?.dataset.filter ?? 'all';
  if (activeFilter !== 'all' && activeFilter !== kind) {
    loader.classList.add('blog-card--hidden');
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network error');
    const { status, items } = await res.json();
    if (status !== 'ok' || !Array.isArray(items) || !items.length) {
      throw new Error('Empty or invalid feed');
    }
    loader.remove();

    const cards = items.map(item => buildExternalCard(item, kind));
    cards.forEach(card => grid.insertBefore(card, empty));
    revealElements(cards);

    const currentFilter = qs('.filter-btn.active')?.dataset.filter ?? 'all';
    applyFilter(currentFilter);
  } catch {
    loader.className = 'medium-loader medium-loader--error';
    loader.innerHTML =
      `Couldn't load articles right now. ` +
      `<a href="${profileUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">Visit ${profileLabel} →</a>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initReveal();
  initCursor();
  initNav();
  initFilter();
  initMagnetic();
  initCardShine();
  initParallax();
  initReadProgress();
  initExternalNavTab('nav-medium-tab', 'mobile-medium-tab', 'medium');
  initExternalNavTab('nav-devto-tab', 'mobile-devto-tab', 'devto');
  loadLocalPosts();
  fetchExternalFeed(MEDIUM_RSS_PROXY, 'medium', 'https://medium.com/@iyashsoni', 'Medium');
  fetchExternalFeed(DEVTO_RSS_PROXY, 'devto', 'https://dev.to/iyashsoni', 'Dev.to');
});
