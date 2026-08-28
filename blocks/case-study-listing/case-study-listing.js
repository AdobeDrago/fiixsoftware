import { readBlockConfig } from '../../scripts/aem.js';

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
  'Wholesale Distribution',
];

// The source page curates its case studies by recency and relevance rather
// than alphabetically. Keep the same sequence for the root listing and for
// filtered results, while allowing any newly authored entry to follow it.
const LISTING_ORDER = [
  'universal-pure',
  'scotts-miracle-gro',
  'dlg-group',
  'westrock-coffee',
  'bush-brothers',
  'noi-sirius',
  'dunlop',
  'pro-vac-fleet',
  'apollo-america',
  'mi-windows-doors',
  'jj-mcdonnell',
  'daikin-comfort',
  'edms-consultants',
  'bsw-timber',
  'takeoff-technologies',
  'cloeren-inc',
  'perth-county-ingredients',
  'farming-maintenance',
  'liberty-oilfield',
  'magna-locations',
  'callan-marine',
  'scottish-sea-farms',
  'rambler',
  'voltalia',
  'anaren-microwave',
  '365-main',
  'clinton-aluminum',
  'jsm-associates',
  'geislinger-corporation',
  'labrie-enviroquip-group',
  'nzsk',
];

const LISTING_RANK = new Map(LISTING_ORDER.map((slug, index) => [slug, index]));

const LISTING_PATH = '/resource-center/case-studies';
const LISTING_PATHS = new Set([LISTING_PATH, `${LISTING_PATH}/`]);

function slugify(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function filterPath(name) {
  // no trailing slash: a page here is addressed by its file name, and a
  // trailing slash would look for an `index` page inside that folder instead
  return `${LISTING_PATH}/${slugify(name)}`;
}

const FILTER_PATHS = new Set([
  ...CATEGORIES.map(filterPath),
  ...INDUSTRIES.map(filterPath),
]);

function normalizePath(path) {
  if (!path) return '';
  const trimmed = path.replace(/\.html$/, '');
  if (trimmed.length > 1 && trimmed.endsWith('/')) return trimmed.slice(0, -1);
  return trimmed;
}

function isCaseStudy(entry) {
  const path = normalizePath(entry.path);
  if (!path.startsWith(`${LISTING_PATH}/`)) return false;
  if (LISTING_PATHS.has(path)) return false;
  // archive pages share the case-studies folder with articles — never treat
  // them as cards
  return !FILTER_PATHS.has(path);
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
    .filter((entry) => matchesIndustry(entry, industry))
    .sort((first, second) => {
      const firstRank = LISTING_RANK.get(normalizePath(first.path).split('/').pop()) ?? Infinity;
      const secondRank = LISTING_RANK.get(normalizePath(second.path).split('/').pop()) ?? Infinity;
      return firstRank - secondRank;
    });
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

  const labelEl = document.createElement('span');
  labelEl.className = 'case-study-listing-label';
  labelEl.textContent = labelText;
  label.append(labelEl);

  const select = document.createElement('select');
  select.name = name;

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = defaultOptionText;
  defaultOption.disabled = true;
  defaultOption.selected = true;
  select.append(defaultOption);

  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'Browse all case studies';
  select.append(allOption);

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
  if (!section) return null;

  const hasNavigation = [...section.children]
    .some((child) => child.classList.contains('resource-navigation-wrapper'));
  if (hasNavigation) section.classList.add('resource-list-section-with-navigation');
  return section;
}

function createToolbar() {
  const toolbar = document.createElement('div');
  toolbar.className = 'case-study-listing-toolbar';
  const { select: category } = createFilter('category', 'Category', 'Sort by category', CATEGORIES);
  const { select: industry } = createFilter('industry', 'Industry', 'Sort by industry', INDUSTRIES);
  toolbar.append(category.closest('label'), industry.closest('label'));
  return { toolbar, category, industry };
}

/**
 * Loads and decorates the case study listing block.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  // optional authored rows: Category / Industry pin the listing to a single
  // archive dimension (live `/resource-center/case-studies/<slug>/` pages)
  const pinnedCategory = config.category || '';
  const pinnedIndustry = config.industry || '';
  const indexUrl = config.index || block.dataset.index || '/case-studies-index.json';

  block.textContent = '';
  const section = markSectionWithNavigation(block);

  const { toolbar, category, industry } = createToolbar();

  if (pinnedCategory) category.value = pinnedCategory;
  if (pinnedIndustry) industry.value = pinnedIndustry;

  const results = document.createElement('ul');
  results.className = 'case-study-listing-results';

  const empty = document.createElement('p');
  empty.className = 'case-study-listing-empty';
  empty.textContent = 'No case studies match your filters.';
  empty.hidden = true;

  block.append(toolbar, results, empty);

  const navigation = section?.querySelector(':scope > .resource-navigation-wrapper');
  const mobileMedia = window.matchMedia('(max-width: 768px)');
  const placeToolbar = () => {
    const isMobile = mobileMedia.matches && navigation;
    toolbar.classList.toggle('case-study-listing-mobile-toolbar', isMobile);
    if (isMobile) section.insertBefore(toolbar, navigation);
    else block.insertBefore(toolbar, results);
  };
  placeToolbar();
  mobileMedia.addEventListener('change', placeToolbar);

  // navigate to dedicated archive pages (or back to the root listing) — same
  // pattern as the live WP term archives under /resource-center/case-studies/
  const onFilterChange = (select) => {
    select.addEventListener('change', () => {
      window.location.href = select.value ? filterPath(select.value) : LISTING_PATH;
    });
  };
  onFilterChange(category);
  onFilterChange(industry);

  const fallbackIndex = `${window.hlx?.codeBasePath || ''}/blocks/case-study-listing/case-study-listing.json`;

  let entries = [];
  try {
    entries = await loadIndex(indexUrl, fallbackIndex);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('failed to load case study index', error);
  }

  const filtered = filterEntries(entries, category.value, industry.value);
  results.replaceChildren(...filtered.map(createCard));
  empty.hidden = filtered.length > 0;
}
