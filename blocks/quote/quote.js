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
 * Decorates a reusable pull quote.
 *
 * Author with a quote in the first row and an optional attribution in the
 * second row. A single row with two columns is also accepted for compact
 * authoring: quote | attribution.
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

  block.replaceChildren(quote);
  if (attribution.hasChildNodes()) block.append(attribution);
}
