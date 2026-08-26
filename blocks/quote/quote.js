/**
 * Moves the contents of an authored block row into a destination element.
 *
 * @param {Element} row the authored block row
 * @param {Element} destination the decorated element to receive the contents
 */
function moveRowContent(row, destination) {
  const cells = [...row.children];
  const sources = cells.length ? cells : [row];
  sources.forEach((source) => {
    while (source.firstChild) destination.append(source.firstChild);
  });
}

/**
 * When quote + attribution are authored in one cell, move the name/title
 * paragraphs out of the quote into the attribution container.
 * Name is detected as a paragraph whose only text is wrapped in <strong>.
 *
 * @param {Element} quote the quote element
 * @param {Element} attribution the attribution element
 */
function extractInlineAttribution(quote, attribution) {
  if (attribution.hasChildNodes()) return;

  const children = [...quote.children];
  const nameIndex = children.findIndex((el) => {
    if (el.tagName !== 'P') return false;
    const strong = el.querySelector(':scope > strong');
    if (!strong) return false;
    return el.textContent.trim() === strong.textContent.trim();
  });

  if (nameIndex < 1) return;

  children.slice(nameIndex).forEach((el) => attribution.append(el));
}

/**
 * Decorates a reusable pull quote.
 *
 * Author with a quote in the first row and an optional attribution in the
 * second row. A single row with two columns is also accepted for compact
 * authoring: quote | attribution. A single cell may also include the
 * attribution after the quote (name in <strong>, then title).
 *
 * Variation: wrap — white overlapping card with bottom-left slit.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const quoteRow = rows[0];
  if (!quoteRow) return;

  const quote = document.createElement('blockquote');
  quote.classList.add('quote-text');

  const attribution = document.createElement('div');
  attribution.classList.add('quote-attribution');

  const isTwoColumnRow = rows.length === 1 && quoteRow.children.length > 1;
  if (isTwoColumnRow) {
    const [quoteCell, ...attributionCells] = quoteRow.children;
    while (quoteCell.firstChild) quote.append(quoteCell.firstChild);
    attributionCells.forEach((cell) => {
      while (cell.firstChild) attribution.append(cell.firstChild);
    });
  } else {
    moveRowContent(quoteRow, quote);
    if (rows[1]) moveRowContent(rows[1], attribution);
  }

  extractInlineAttribution(quote, attribution);

  // Ensure a paragraph so wrap variation can style production-like quote marks
  if (![...quote.children].some((el) => el.tagName === 'P')) {
    const paragraph = document.createElement('p');
    while (quote.firstChild) paragraph.append(quote.firstChild);
    quote.append(paragraph);
  }

  block.replaceChildren(quote);
  if (attribution.hasChildNodes()) block.append(attribution);
}
