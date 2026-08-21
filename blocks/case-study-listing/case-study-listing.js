const CATEGORIES = [
  'Analytics',
  'Asset Management',
  'CMMS Implementation',
  'Condition-based Maintenance',
  'Integrations',
  'Parts Management',
  'Predictive Maintenance',
  'ROI',
  'Sustainability',
  'Work Order Management',
];

const INDUSTRIES = [
  'Agriculture',
  'Construction',
  'Discrete Manufacturing',
  'Facilities Management',
  'Fleet Management',
  'Mining',
  'Oil & Gas',
  'Process Manufacturing',
  'Renewable Energy',
  'Wholesale Distribution',
];

const LISTING_PATHS = new Set(['/resource-center/case-studies', '/resource-center/case-studies/']);

function normalizePath(path) {
  if (!path) return '';
  const trimmed = path.replace(/\.html$/, '');
  if (trimmed.length > 1 && trimmed.endsWith('/')) return trimmed.slice(0, -1);
  return trimmed;
}

function isCaseStudy(entry) {
  const path = normalizePath(entry.path);
  if (!path.startsWith('/resource-center/case-studies/')) return false;
  return !LISTING_PATHS.has(path);
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (!value) return [];
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function matchesCategory(entry, category) {
  if (!category) return true;
  return parseList(entry.category).includes(category);
}

function matchesIndustry(entry, industry) {
  if (!industry) return true;
  return parseList(entry.industry).includes(industry);
}

function filterEntries(entries, category, industry) {
  return entries
    .filter(isCaseStudy)
    .filter((entry) => matchesCategory(entry, category))
    .filter((entry) => matchesIndustry(entry, industry));
}

function createCard(entry) {
  const item = document.createElement('li');
  item.className = 'case-study-listing-card';

  const link = document.createElement('a');
  link.className = 'case-study-listing-card-link';
  link.href = normalizePath(entry.path) || entry.path;

  if (entry.image) {
    const figure = document.createElement('div');
    figure.className = 'case-study-listing-card-image';
    const img = document.createElement('img');
    img.src = entry.image;
    img.alt = '';
    img.loading = 'lazy';
    figure.append(img);
    link.append(figure);
  }

  const body = document.createElement('div');
  body.className = 'case-study-listing-card-body';

  const type = document.createElement('p');
  type.className = 'case-study-listing-card-type';
  type.textContent = 'Case study';
  body.append(type);

  const title = document.createElement('h3');
  title.className = 'case-study-listing-card-title';
  title.textContent = entry.cardTitle || entry.title || 'Untitled';
  body.append(title);

  const cta = document.createElement('span');
  cta.className = 'case-study-listing-card-cta';
  cta.textContent = 'Explore now';
  body.append(cta);

  link.append(body);
  item.append(link);
  return item;
}

function createFilter(name, labelText, defaultOptionText, values) {
  const label = document.createElement('label');
  label.className = `case-study-listing-${name}`;

  const labelText2 = document.createElement('span');
  labelText2.className = 'case-study-listing-label';
  labelText2.textContent = labelText;
  label.append(labelText2);

  const select = document.createElement('select');
  select.name = name;

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = defaultOptionText;
  select.append(defaultOption);

  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  });

  label.append(select);
  return { label, select };
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

function markSectionWithNavigation(block) {
  const section = block.closest('.section');
  if (!section) return;

  const hasNavigation = [...section.children]
    .some((child) => child.classList.contains('resource-navigation-wrapper'));
  if (hasNavigation) section.classList.add('resource-list-section-with-navigation');
}

/**
 * Loads and decorates the case study listing block.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const indexUrl = block.dataset.index || '/case-studies-index.json';
  block.textContent = '';

  markSectionWithNavigation(block);

  const toolbar = document.createElement('div');
  toolbar.className = 'case-study-listing-toolbar';
  const { select: category } = createFilter('category', 'Category', 'Sort by categories', CATEGORIES);
  const { select: industry } = createFilter('industry', 'Industry', 'Sort by industries', INDUSTRIES);
  toolbar.append(category.closest('label'), industry.closest('label'));

  const results = document.createElement('ul');
  results.className = 'case-study-listing-results';

  const empty = document.createElement('p');
  empty.className = 'case-study-listing-empty';
  empty.textContent = 'No case studies match your filters.';
  empty.hidden = true;

  block.append(toolbar, results, empty);

  const fallbackIndex = `${window.hlx?.codeBasePath || ''}/blocks/case-study-listing/case-study-listing.json`;

  let entries = [];
  try {
    entries = await loadIndex(indexUrl, fallbackIndex);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('failed to load case study index', error);
  }

  const render = () => {
    const filtered = filterEntries(entries, category.value, industry.value);
    results.replaceChildren(...filtered.map(createCard));
    empty.hidden = filtered.length > 0;
  };

  category.addEventListener('change', render);
  industry.addEventListener('change', render);
  render();
}
