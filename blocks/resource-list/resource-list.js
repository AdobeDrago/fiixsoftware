const DEFAULT_CTA_LABEL = 'Explore now';

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getImage(cell) {
  const image = cell?.querySelector('picture, img');
  if (!image) return null;
  return image.matches('img') || image.querySelector('img') ? image : null;
}

function getDestination(cell) {
  if (!cell) return '';

  const link = cell.querySelector('a');
  const value = normalizeText(link ? link.getAttribute('href') : cell.textContent);
  if (!value) return '';

  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (error) {
    return '';
  }
}

function isConfigurationRow(row) {
  const cells = [...row.children];
  return cells.length >= 2 && normalizeText(cells[0].textContent).toLowerCase() === 'cta label';
}

function isFeatured(value) {
  return ['yes', 'true', 'featured'].includes(normalizeText(value).toLowerCase());
}

function getColumnIndex(labels, name, fallback = null) {
  const index = labels.indexOf(name);
  return index === -1 ? fallback : index;
}

function getColumnMap(rows) {
  const headerRow = rows.find((row) => {
    const labels = [...row.children].map((cell) => normalizeText(cell.textContent).toLowerCase());
    return labels.includes('destination url');
  });

  if (headerRow) {
    const labels = [...headerRow.children]
      .map((cell) => normalizeText(cell.textContent).toLowerCase());
    return {
      image: getColumnIndex(labels, 'e-book image', 0),
      title: getColumnIndex(labels, 'title', 1),
      subtitle: getColumnIndex(labels, 'subtitle'),
      destination: getColumnIndex(labels, 'destination url', 2),
      type: getColumnIndex(labels, 'content type', 3),
      featured: getColumnIndex(labels, 'featured', 4),
    };
  }

  const usesSubtitle = rows.some((row) => row.children.length >= 6);
  return {
    image: 0,
    title: 1,
    subtitle: usesSubtitle ? 2 : null,
    destination: usesSubtitle ? 3 : 2,
    type: usesSubtitle ? 4 : 3,
    featured: usesSubtitle ? 5 : 4,
  };
}

function getCardData(row, columnMap) {
  const cells = [...row.children];
  const image = getImage(cells[columnMap.image]);
  const title = normalizeText(cells[columnMap.title]?.textContent);
  const subtitle = normalizeText(cells[columnMap.subtitle]?.textContent);
  const destination = getDestination(cells[columnMap.destination]);
  const type = normalizeText(cells[columnMap.type]?.textContent);

  if (!image || !title || !destination) return null;

  return {
    image,
    title,
    subtitle,
    destination,
    type,
    featured: isFeatured(cells[columnMap.featured]?.textContent),
  };
}

function createCard(cardData, ctaLabel) {
  const {
    image, title: titleText, subtitle: subtitleText, destination, type: typeText, featured,
  } = cardData;
  const card = document.createElement('li');
  card.className = 'resource-list-card';
  if (featured) card.classList.add('resource-list-card-featured');

  const cardLink = document.createElement('a');
  cardLink.className = 'resource-list-card-link';
  cardLink.href = destination;

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'resource-list-card-image';
  const img = image.matches('img') ? image : image.querySelector('img');
  if (img) {
    if (!normalizeText(img.alt)) img.alt = titleText;
    if (!img.getAttribute('loading')) img.loading = 'lazy';
    img.decoding = 'async';
  }
  imageWrapper.append(image);

  const body = document.createElement('div');
  body.className = 'resource-list-card-body';

  if (featured) {
    const featuredLabel = document.createElement('div');
    featuredLabel.className = 'resource-list-card-featured-label';
    featuredLabel.textContent = 'Featured';
    body.append(featuredLabel);
  }

  if (typeText) {
    const type = document.createElement('p');
    type.className = 'resource-list-card-type';
    type.textContent = typeText;
    body.append(type);
  }

  const title = document.createElement('h3');
  title.className = 'resource-list-card-title';
  title.textContent = titleText;

  let subtitle;
  if (subtitleText) {
    subtitle = document.createElement('p');
    subtitle.className = 'resource-list-card-subtitle';
    subtitle.textContent = subtitleText;
  }

  const cta = document.createElement('span');
  cta.className = 'resource-list-card-cta';
  cta.textContent = ctaLabel;

  body.append(title);
  if (subtitle) body.append(subtitle);
  body.append(cta);
  cardLink.append(imageWrapper, body);
  card.append(cardLink);
  return card;
}

function createCardGroup(cards, ctaLabel, groupClass) {
  if (!cards.length) return null;

  const group = document.createElement('div');
  group.className = `resource-list-group ${groupClass}`;

  const list = document.createElement('ul');
  list.className = groupClass === 'resource-list-featured' ? 'resource-list-featured-grid' : 'resource-list-grid';
  list.append(...cards.map((card) => createCard(card, ctaLabel)));
  group.append(list);
  return group;
}

function markResourceListSection(block) {
  const section = block.closest('.section');
  if (!section) return;

  section.classList.add('resource-list-section');
  const hasNavigation = [...section.children]
    .some((child) => child.classList.contains('resource-navigation-wrapper'));
  if (hasNavigation) section.classList.add('resource-list-section-with-navigation');
}

/**
 * Loads and decorates the generic resource listing block.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  block.classList.add('resource-list');
  markResourceListSection(block);

  const rows = [...block.children];
  const configRow = rows.find(isConfigurationRow);
  const columnMap = getColumnMap(rows);
  const ctaLabel = normalizeText(configRow?.children[1]?.textContent) || DEFAULT_CTA_LABEL;
  const cards = rows
    .filter((row) => row !== configRow)
    .map((row) => getCardData(row, columnMap))
    .filter(Boolean);
  const featuredCards = cards.filter((card) => card.featured);
  const standardCards = cards.filter((card) => !card.featured);

  const groups = [
    createCardGroup(featuredCards, ctaLabel, 'resource-list-featured'),
    createCardGroup(standardCards, ctaLabel, 'resource-list-standard'),
  ].filter(Boolean);

  block.replaceChildren(...groups);
}
