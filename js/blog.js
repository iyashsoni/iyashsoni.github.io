import { initReveal, revealElements, initCursor } from './animations.js';
import { qs, qsa } from './utils.js';

const MEDIUM_RSS_PROXY =
  'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fmedium.com%2Ffeed%2F%40iyashsoni';

const DEVTO_RSS_PROXY =
  'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fdev.to%2Ffeed%2Fiyashsoni';

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

function applyFilter(filter) {
  // Live query — includes dynamically inserted cards AND loader/error divs
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
    // Insert local posts at the top of the grid (before external / empty)
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

function buildDevtoCard(item) {
  const text = extractText(item.description);
  const excerpt = text.length > 200 ? text.slice(0, 200).trimEnd() + '…' : text;
  const readMins = estimateReadTime(text);
  const date = formatDate(item.pubDate);

  const article = document.createElement('article');
  article.className = 'blog-card reveal';
  article.dataset.category = 'devto';
  article.setAttribute('role', 'listitem');
  article.innerHTML = `
    <a href="${item.link}" target="_blank" rel="noopener noreferrer" style="display:contents">
      <div class="blog-card__meta">
        <span class="blog-card__category blog-card__category--devto">Dev.to</span>
        <span class="blog-card__date">${date}</span>
      </div>
      <h2 class="blog-card__title">${item.title}</h2>
      <p class="blog-card__excerpt">${excerpt}</p>
      <span class="blog-card__read">↗ ${readMins} min read</span>
    </a>
  `;
  return article;
}

async function fetchDevtoPosts() {
  const grid = qs('.blog-grid');
  const empty = qs('.blog-empty');
  if (!grid) return;

  const loader = document.createElement('div');
  loader.id = 'devto-loader';
  loader.dataset.category = 'devto';
  loader.className = 'medium-loader';
  loader.textContent = 'Loading articles from Dev.to…';
  grid.insertBefore(loader, empty);

  const activeFilter = qs('.filter-btn.active')?.dataset.filter ?? 'all';
  if (activeFilter !== 'all' && activeFilter !== 'devto') {
    loader.classList.add('blog-card--hidden');
  }

  try {
    const res = await fetch(DEVTO_RSS_PROXY);
    if (!res.ok) throw new Error('Network error');
    const { status, items } = await res.json();
    if (status !== 'ok' || !Array.isArray(items) || !items.length) {
      throw new Error('Empty or invalid feed');
    }

    loader.remove();

    const cards = items.map(buildDevtoCard);
    cards.forEach(card => grid.insertBefore(card, empty));
    revealElements(cards);

    const currentFilter = qs('.filter-btn.active')?.dataset.filter ?? 'all';
    applyFilter(currentFilter);

  } catch (err) {
    console.error('[Dev.to]', err);
    loader.className = 'medium-loader medium-loader--error';
    loader.innerHTML =
      'Couldn\'t load Dev.to articles right now. ' +
      '<a href="https://dev.to/iyashsoni" target="_blank" rel="noopener noreferrer" ' +
      'style="color:var(--accent)">Visit profile →</a>';
  }
}

function buildMediumCard(item) {
  const text = extractText(item.description);
  const excerpt = text.length > 200 ? text.slice(0, 200).trimEnd() + '…' : text;
  const readMins = estimateReadTime(text);
  const date = formatDate(item.pubDate);

  const article = document.createElement('article');
  article.className = 'blog-card reveal';
  article.dataset.category = 'medium';
  article.setAttribute('role', 'listitem');
  article.innerHTML = `
    <a href="${item.link}" target="_blank" rel="noopener noreferrer" style="display:contents">
      <div class="blog-card__meta">
        <span class="blog-card__category blog-card__category--medium">Medium</span>
        <span class="blog-card__date">${date}</span>
      </div>
      <h2 class="blog-card__title">${item.title}</h2>
      <p class="blog-card__excerpt">${excerpt}</p>
      <span class="blog-card__read">↗ ${readMins} min read</span>
    </a>
  `;
  return article;
}

async function fetchMediumPosts() {
  const grid = qs('.blog-grid');
  const empty = qs('.blog-empty');
  if (!grid) return;

  // Insert loading indicator
  const loader = document.createElement('div');
  loader.id = 'medium-loader';
  loader.dataset.category = 'medium';
  loader.className = 'medium-loader';
  loader.textContent = 'Loading articles from Medium…';
  grid.insertBefore(loader, empty);

  // Hide loader if current filter isn't all/medium
  const activeFilter = qs('.filter-btn.active')?.dataset.filter ?? 'all';
  if (activeFilter !== 'all' && activeFilter !== 'medium') {
    loader.classList.add('blog-card--hidden');
  }

  try {
    const res = await fetch(MEDIUM_RSS_PROXY);
    if (!res.ok) throw new Error('Network error');
    const { status, items } = await res.json();
    if (status !== 'ok' || !Array.isArray(items) || !items.length) {
      throw new Error('Empty or invalid feed');
    }

    loader.remove();

    const cards = items.map(buildMediumCard);
    cards.forEach(card => grid.insertBefore(card, empty));

    // Observe reveal for new cards
    revealElements(cards);

    // Respect the currently active filter
    const currentFilter = qs('.filter-btn.active')?.dataset.filter ?? 'all';
    applyFilter(currentFilter);

  } catch {
    loader.className = 'medium-loader medium-loader--error';
    loader.innerHTML =
      'Couldn\'t load Medium articles right now. ' +
      '<a href="https://iyashsoni.medium.com" target="_blank" rel="noopener noreferrer" ' +
      'style="color:var(--accent)">Visit profile →</a>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initCursor();
  initNav();
  initFilter();
  initExternalNavTab('nav-medium-tab', 'mobile-medium-tab', 'medium');
  initExternalNavTab('nav-devto-tab', 'mobile-devto-tab', 'devto');
  loadLocalPosts();
  fetchMediumPosts();
  fetchDevtoPosts();
});
