const DEFAULT_CTA_LABEL = 'Explore now';

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getImage(cell) {
  return cell?.querySelector('picture, img');
}

function getDestination(cell) {
  if (!cell) return '';

  const link = cell.querySelector('a[href]');
  const value = normalizeText(link?.getAttribute('href') || cell.textContent);
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

function createCard(row, ctaLabel) {
  const cells = [...row.children];
  const image = getImage(cells[0]);
  const titleText = normalizeText(cells[1]?.textContent);
  const destination = getDestination(cells[2]);

  if (!image || !titleText || !destination) return null;

  const card = document.createElement('li');
  card.className = 'ebook-list-card';

  const cardLink = document.createElement('a');
  cardLink.className = 'ebook-list-card-link';
  cardLink.href = destination;

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'ebook-list-card-image';
  const img = image.matches('img') ? image : image.querySelector('img');
  if (img) {
    img.alt = img.alt || titleText;
    img.loading = img.loading || 'lazy';
    img.decoding = 'async';
  }
  imageWrapper.append(image);

  const body = document.createElement('div');
  body.className = 'ebook-list-card-body';

  const type = document.createElement('p');
  type.className = 'ebook-list-card-type';
  type.textContent = 'Ebook';

  const title = document.createElement('h2');
  title.className = 'ebook-list-card-title';
  title.textContent = titleText;

  const cta = document.createElement('span');
  cta.className = 'ebook-list-card-cta';
  cta.textContent = ctaLabel;

  body.append(type, title, cta);
  cardLink.append(imageWrapper, body);
  card.append(cardLink);
  return card;
}

/**
 * Loads and decorates the e-book listing block.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const configRow = rows.find(isConfigurationRow);
  const ctaLabel = normalizeText(configRow?.children[1]?.textContent) || DEFAULT_CTA_LABEL;
  const cards = rows
    .filter((row) => row !== configRow)
    .map((row) => createCard(row, ctaLabel))
    .filter(Boolean);

  const list = document.createElement('ul');
  list.className = 'ebook-list-grid';
  list.append(...cards);
  block.replaceChildren(list);
}
