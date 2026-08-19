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
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
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

function populateCategories(select) {
  CATEGORIES.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.append(option);
  });
}

async function fetchIndex(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`failed to load ${url}`);
  const json = await resp.json();
  return Array.isArray(json.data) ? json.data : [];
}

async function loadIndex(indexUrl) {
  const fallbackUrl = `${window.hlx?.codeBasePath || ''}/widgets/blog-listing/blog-listing.json`;
  try {
    return await fetchIndex(indexUrl);
  } catch (error) {
    if (indexUrl === fallbackUrl) throw error;
    return fetchIndex(fallbackUrl);
  }
}

export default async function decorate(widget) {
  const form = widget.querySelector('.blog-listing-toolbar');
  const search = widget.querySelector('input[name="q"]');
  const select = widget.querySelector('select[name="category"]');
  const results = widget.querySelector('.blog-listing-results');
  const empty = widget.querySelector('.blog-listing-empty');
  if (!form || !search || !select || !results || !empty) return;

  populateCategories(select);

  let entries = [];
  const indexUrl = widget.dataset.index || '/query-index.json';
  try {
    entries = await loadIndex(indexUrl);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('failed to load blog index', error);
  }

  const render = () => {
    const filtered = filterEntries(entries, search.value.trim().toLowerCase(), select.value);
    results.replaceChildren(...filtered.map(createCard));
    empty.hidden = filtered.length > 0;
  };

  search.addEventListener('input', render);
  select.addEventListener('change', render);
  render();
}
