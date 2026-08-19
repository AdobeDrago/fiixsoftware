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
 * Decorates a compact heading-and-link callout.
 *
 * Author with a single row containing a heading and CTA link in separate
 * columns. Two single-column rows (heading, then CTA) are also supported.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const headingRow = rows[0];
  if (!headingRow) return;

  const heading = document.createElement('h2');
  const action = document.createElement('div');
  action.classList.add('cta-callout-action');

  const isTwoColumnRow = rows.length === 1 && headingRow.children.length > 1;
  if (isTwoColumnRow) {
    const [headingCell, ...actionCells] = headingRow.children;
    heading.textContent = headingCell.textContent.trim();
    actionCells.forEach((cell) => {
      while (cell.firstChild) action.append(cell.firstChild);
    });
  } else {
    heading.textContent = headingRow.textContent.trim();
    if (rows[1]) moveRowContent(rows[1], action);
  }

  block.replaceChildren(heading);
  if (action.hasChildNodes()) block.append(action);
}
