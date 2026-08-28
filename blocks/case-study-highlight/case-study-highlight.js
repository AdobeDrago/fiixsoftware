/**
 * Move all children from an authored cell into an element.
 *
 * @param {Element} cell source cell
 * @param {Element} destination decorated destination
 */
function moveCellContent(cell, destination) {
  while (cell?.firstChild) destination.append(cell.firstChild);
}

/**
 * Return the visual direction of a statistic, falling back to an increase.
 *
 * @param {Element} cell authored sign cell
 * @returns {'increase'|'decrease'} statistic direction
 */
function getStatDirection(cell) {
  const value = cell?.textContent.trim().toLowerCase() || '';
  return /^(?:-|−|minus|decrease|decreased|down)$/.test(value)
    ? 'decrease'
    : 'increase';
}

/**
 * Decorates a customer testimonial with supporting outcome statistics.
 *
 * Authoring format:
 * - First row: quote | author image | author name and role
 * - Every following row: minus/plus | metric | metric description
 *
 * The sign cell accepts `minus` / `-` / `−` for a decrease; all other values
 * render as an increase. This keeps the decorative sign out of the metric's
 * accessible name while allowing authors to control it explicitly.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const [testimonialRow, ...statRows] = [...block.children];
  if (!testimonialRow) return;

  const [quoteCell, imageCell, attributionCell] = [...testimonialRow.children];
  const testimonial = document.createElement('div');
  testimonial.className = 'case-study-highlight-testimonial';

  const quote = document.createElement('blockquote');
  quote.className = 'case-study-highlight-quote';
  moveCellContent(quoteCell, quote);
  testimonial.append(quote);

  if (imageCell || attributionCell) {
    const author = document.createElement('div');
    author.className = 'case-study-highlight-author';

    if (imageCell?.querySelector('picture, img')) {
      imageCell.classList.add('case-study-highlight-author-image');
      author.append(imageCell);
    }

    if (attributionCell?.textContent.trim()) {
      attributionCell.classList.add('case-study-highlight-author-details');
      author.append(attributionCell);
    }

    if (author.hasChildNodes()) testimonial.append(author);
  }

  const stats = document.createElement('ul');
  stats.className = 'case-study-highlight-stats';

  statRows.forEach((row) => {
    const [signCell, valueCell, labelCell] = [...row.children];
    if (!valueCell?.textContent.trim() && !labelCell?.textContent.trim()) return;

    const stat = document.createElement('li');
    stat.className = `case-study-highlight-stat ${getStatDirection(signCell)}`;

    const sign = document.createElement('span');
    sign.className = 'case-study-highlight-stat-sign';
    sign.setAttribute('aria-hidden', 'true');
    sign.textContent = stat.classList.contains('decrease') ? '−' : '+';

    const value = document.createElement('span');
    value.className = 'case-study-highlight-stat-value';
    moveCellContent(valueCell, value);

    const label = document.createElement('span');
    label.className = 'case-study-highlight-stat-label';
    moveCellContent(labelCell, label);

    stat.append(sign, value, label);
    stats.append(stat);
  });

  block.replaceChildren(testimonial);
  if (stats.children.length) block.append(stats);
}
