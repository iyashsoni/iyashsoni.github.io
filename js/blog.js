import { initReveal, revealElements, initCursor } from './animations.js';
import { qs, qsa } from './utils.js';

const MEDIUM_RSS_PROXY =
  'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fmedium.com%2Ffeed%2F%40iyashsoni';

const DEVTO_API =
  'https://dev.to/api/v1/articles?username=iyashsoni&per_page=30';

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
  // Live query — includes dynamically inserted cards
  const cards = qsa('.blog-card[data-category]');
  const empty = qs('.blog-empty');
  let visible = 0;

  cards.forEach(card => {
    const match = filter === 'all' || card.dataset.category === filter;
    card.classList.toggle('blog-card--hidden', !match);
    if (match) visible++;
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
  const date = formatDate(item.published_at);
  const readMins = item.reading_time_minutes ?? 1;
  const reactions = item.public_reactions_count ?? 0;
  const comments = item.comments_count ?? 0;

  const stats = [
    `↗ ${readMins} min read`,
    reactions > 0 ? `♥ ${reactions}` : null,
    comments > 0  ? `💬 ${comments}` : null,
  ].filter(Boolean).join(' · ');

  const article = document.createElement('article');
  article.className = 'blog-card reveal';
  article.dataset.category = 'devto';
  article.setAttribute('role', 'listitem');
  article.innerHTML = `
    <a href="${item.url}" target="_blank" rel="noopener noreferrer" style="display:contents">
      <div class="blog-card__meta">
        <span class="blog-card__category blog-card__category--devto">Dev.to</span>
        <span class="blog-card__date">${date}</span>
      </div>
      <h2 class="blog-card__title">${item.title}</h2>
      <p class="blog-card__excerpt">${item.description ?? ''}</p>
      <span class="blog-card__read">${stats}</span>
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
    const res = await fetch(DEVTO_API, {
      headers: { Accept: 'application/vnd.forem.api-v1+json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();
    if (!Array.isArray(items) || !items.length) throw new Error('No articles');

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
  fetchMediumPosts();
  fetchDevtoPosts();
});
