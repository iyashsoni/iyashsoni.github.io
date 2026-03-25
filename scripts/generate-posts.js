#!/usr/bin/env node
/**
 * Scans blog/[category]/[slug]/index.html files and writes blog/posts.json.
 * Run manually:  node scripts/generate-posts.js
 * Auto-runs via: .githooks/pre-commit  (set up with `npm run setup`)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR   = join(__dirname, '..', 'blog');
const CATEGORIES = ['tech', 'life', 'travel'];
const MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function shortDate(iso) {
  if (!iso) return '';
  const parts = iso.split('-');
  return `${MONTHS[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
}

function extractMeta(html, slug, category) {
  const titleMatch    = html.match(/<h1[^>]*class="post-header__title"[^>]*>([\s\S]*?)<\/h1>/);
  const subtitleMatch = html.match(/<p[^>]*class="post-header__subtitle"[^>]*>([\s\S]*?)<\/p>/);
  const timeMatch     = html.match(/<time[^>]*datetime="([^"]*)"[^>]*>/);
  const readMatch     = html.match(/(\d+)\s*min\s*read/);

  const title      = titleMatch    ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : slug;
  const excerpt    = subtitleMatch ? subtitleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
  const isoDate    = timeMatch     ? timeMatch[1] : '';
  const readTime   = readMatch     ? `${readMatch[1]} min read` : '';

  return {
    title,
    excerpt,
    category,
    slug,
    isoDate,
    dateDisplay: shortDate(isoDate),
    readTime,
    url: `/blog/${category}/${slug}/`,
  };
}

const posts = [];

for (const category of CATEGORIES) {
  const catDir = join(BLOG_DIR, category);
  if (!existsSync(catDir)) continue;

  for (const entry of readdirSync(catDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const postFile = join(catDir, entry.name, 'index.html');
    if (!existsSync(postFile)) continue;
    const html = readFileSync(postFile, 'utf8');
    posts.push(extractMeta(html, entry.name, category));
  }
}

// Sort newest first
posts.sort((a, b) => (b.isoDate > a.isoDate ? 1 : b.isoDate < a.isoDate ? -1 : 0));

const outPath = join(BLOG_DIR, 'posts.json');
writeFileSync(outPath, JSON.stringify(posts, null, 2) + '\n');
console.log(`✓ posts.json — ${posts.length} post${posts.length !== 1 ? 's' : ''}`);
