import { readBlockConfig } from '../../scripts/aem.js';

const CATEGORIES = [
  'Asset management',
  'Buying software',
  'CMMS basics',
  'Implementation',
  'Integration',
  'Maintenance metrics',
  'Maintenance news',
  'Maintenance strategies',
  'Modern maintenance',
  'Press',
  'Sustainability and social impact',
  'Work order academy',
];

const LISTING_PATHS = new Set(['/blog', '/blog/', '/blog.html']);

/* production lists 16 posts per page on /blog/ (see fiixsoftware.com/blog) */
const PAGE_SIZE = 9;

function slugifyCategory(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function categoryPath(name) {
  // no trailing slash: unlike the source's WP archives, a page here is
  // addressed by its file name, and a trailing slash would look for an
  // `index` page inside that folder instead
  return `/category/${slugifyCategory(name)}`;
}

function normalizePath(path) {
  if (!path) return '';
  const trimmed = path.replace(/\.html$/, '');
  if (trimmed.length > 1 && trimmed.endsWith('/')) return trimmed.slice(0, -1);
  return trimmed;
}

function isArticle(entry) {
  const path = normalizePath(entry.path);
  if (!path.startsWith('/blog/')) return false;
  return !LISTING_PATHS.has(path);
}

function compareDates(left, right) {
  return String(right.date || '').localeCompare(String(left.date || ''));
}

function parseCategories(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (!value) return [];
  return String(value).split(',').map((item) => String(item).trim()).filter(Boolean);
}

function matchesQuery(entry, query) {
  if (!query) return true;
  const haystack = `${entry.title || ''} ${entry.description || ''}`.toLowerCase();
  return haystack.includes(query);
}

function matchesCategory(entry, category) {
  if (!category || category === 'Press') return true;
  return parseCategories(entry.category).includes(category);
}

function filterEntries(entries, query, category) {
  const filtered = entries
    .filter(isArticle)
    .filter((entry) => matchesCategory(entry, category))
    .filter((entry) => matchesQuery(entry, query))
    .sort(compareDates);

  if (category === 'Press') return filtered.slice(0, 6);
  return filtered;
}

function pageCount(total) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

/**
 * Builds the visible pagination tokens for the current page, matching the
 * live site's WordPress-style control (midsize 2 + end size 1 + prev/next).
 * @param {number} current 1-based page
 * @param {number} total total pages
 * @returns {Array<number|'ellipsis'|'prev'|'next'>}
 */
function paginationItems(current, total) {
  if (total <= 1) return [];

  const pages = new Set([1, total]);
  for (let page = current - 2; page <= current + 2; page += 1) {
    if (page >= 1 && page <= total) pages.add(page);
  }

  const sorted = [...pages].sort((left, right) => left - right);
  const items = [];
  if (current > 1) items.push('prev');

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push('ellipsis');
    items.push(page);
  });

  if (current < total) items.push('next');
  return items;
}

function createPagination() {
  const nav = document.createElement('nav');
  nav.className = 'blog-listing-pagination';
  nav.setAttribute('aria-label', 'Blog pages');
  const list = document.createElement('ul');
  nav.append(list);
  return { nav, list };
}

function renderPagination(list, current, total, onSelect) {
  list.replaceChildren();
  paginationItems(current, total).forEach((item) => {
    const li = document.createElement('li');

    if (item === 'ellipsis') {
      li.className = 'blog-listing-pagination-ellipsis';
      const span = document.createElement('span');
      span.textContent = '…';
      span.setAttribute('aria-hidden', 'true');
      li.append(span);
      list.append(li);
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';

    if (item === 'prev') {
      li.className = 'blog-listing-pagination-prev';
      button.setAttribute('aria-label', 'Previous page');
      button.addEventListener('click', () => onSelect(current - 1));
    } else if (item === 'next') {
      li.className = 'blog-listing-pagination-next';
      button.setAttribute('aria-label', 'Next page');
      button.addEventListener('click', () => onSelect(current + 1));
    } else {
      button.textContent = String(item);
      button.setAttribute('aria-label', `Page ${item}`);
      if (item === current) {
        li.className = 'blog-listing-pagination-current';
        button.setAttribute('aria-current', 'page');
      } else {
        button.addEventListener('click', () => onSelect(item));
      }
    }

    li.append(button);
    list.append(li);
  });
}

function createCard(entry) {
  const item = document.createElement('li');
  item.className = 'blog-listing-card';

  const link = document.createElement('a');
  link.href = normalizePath(entry.path) || entry.path;

  if (entry.image) {
    const figure = document.createElement('div');
    figure.className = 'blog-listing-card-image';
    const img = document.createElement('img');
    img.src = entry.image;
    img.alt = '';
    img.loading = 'lazy';
    figure.append(img);
    link.append(figure);
  }

  const body = document.createElement('div');
  body.className = 'blog-listing-card-body';

  const categories = parseCategories(entry.category);
  if (categories.length) {
    const category = document.createElement('p');
    category.className = 'blog-listing-card-category';
    category.textContent = categories.join(' · ');
    body.append(category);
  }

  const title = document.createElement('p');
  title.className = 'blog-listing-card-title';
  title.textContent = entry.title || 'Untitled';
  body.append(title);

  link.append(body);
  item.append(link);
  return item;
}

function createToolbar() {
  const form = document.createElement('div');
  form.className = 'blog-listing-toolbar';

  const searchLabel = document.createElement('label');
  searchLabel.className = 'blog-listing-search';
  const searchText = document.createElement('span');
  searchText.className = 'blog-listing-label';
  searchText.textContent = 'Search';
  const search = document.createElement('input');
  search.type = 'search';
  search.name = 'q';
  search.placeholder = 'Search blogs';
  search.autocomplete = 'off';
  searchLabel.append(searchText, search);

  const categoryLabel = document.createElement('label');
  categoryLabel.className = 'blog-listing-category';
  const categoryText = document.createElement('span');
  categoryText.className = 'blog-listing-label';
  categoryText.textContent = 'Category';
  const select = document.createElement('select');
  select.name = 'category';
  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'All categories';
  select.append(allOption);
  CATEGORIES.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.append(option);
  });
  categoryLabel.append(categoryText, select);

  form.append(searchLabel, categoryLabel);
  return { form, search, select };
}

async function fetchIndex(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`failed to load ${url}`);
  const json = await resp.json();
  return Array.isArray(json.data) ? json.data : [];
}

async function loadIndex(indexUrl, fallbackUrl) {
  try {
    return await fetchIndex(indexUrl);
  } catch (error) {
    if (indexUrl === fallbackUrl) throw error;
    return fetchIndex(fallbackUrl);
  }
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  // optional authored rows: Category (pins the listing), Index (override JSON)
  const fixedCategory = config.category || '';
  const fallbackIndex = `${window.hlx?.codeBasePath || ''}/blocks/blog-listing/blog-listing.json`;
  const indexUrl = config.index || fallbackIndex;

  block.textContent = '';

  const { form, search, select } = createToolbar();
  const results = document.createElement('ul');
  results.className = 'blog-listing-results';
  const empty = document.createElement('p');
  empty.className = 'blog-listing-empty';
  empty.textContent = 'No posts match your filters.';
  empty.hidden = true;
  const { nav: pagination, list: paginationList } = createPagination();
  block.append(form, results, empty, pagination);

  // a page can pin the block to a single category to reproduce the source's
  // dedicated `/category/<slug>/` archives instead of the toolbar filtering
  // the shared `/blog/` listing in place
  if (fixedCategory) {
    form.hidden = true;
    select.value = fixedCategory;
  } else {
    select.addEventListener('change', () => {
      window.location.href = select.value ? categoryPath(select.value) : '/blog/';
    });
  }

  let entries = [];
  let currentPage = 1;
  try {
    entries = await loadIndex(indexUrl, fallbackIndex);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('failed to load blog index', error);
  }

  const render = () => {
    const filtered = filterEntries(entries, search.value.trim().toLowerCase(), fixedCategory);
    const totalPages = pageCount(filtered.length);
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageEntries = filtered.slice(start, start + PAGE_SIZE);
    results.replaceChildren(...pageEntries.map(createCard));
    empty.hidden = filtered.length > 0;

    pagination.hidden = filtered.length === 0 || totalPages <= 1;
    if (!pagination.hidden) {
      renderPagination(paginationList, currentPage, totalPages, (page) => {
        currentPage = page;
        render();
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  search.addEventListener('input', () => {
    currentPage = 1;
    render();
  });
  render();
}
