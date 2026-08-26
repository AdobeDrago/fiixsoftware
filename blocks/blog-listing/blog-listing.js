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
  block.append(form, results, empty);

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
  try {
    entries = await loadIndex(indexUrl, fallbackIndex);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('failed to load blog index', error);
  }

  const render = () => {
    const filtered = filterEntries(entries, search.value.trim().toLowerCase(), fixedCategory);
    results.replaceChildren(...filtered.map(createCard));
    empty.hidden = filtered.length > 0;
  };

  search.addEventListener('input', render);
  render();
}
