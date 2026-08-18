/*
 * Table Block
 * Recreate a semantic HTML <table> from an authored block.
 * https://www.aem.live/developer/block-collection/table
 *
 * The first row of the block is treated as the header row (unless the block has
 * the `no-header` variant class). Each subsequent row becomes a table body row.
 */

function buildCell(rowIndex, hasHeader) {
  const el = rowIndex === 0 && hasHeader
    ? document.createElement('th')
    : document.createElement('td');
  if (rowIndex === 0 && hasHeader) el.setAttribute('scope', 'col');
  return el;
}

/**
 * loads and decorates the table block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const hasHeader = !block.classList.contains('no-header');

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.append(thead, tbody);

  [...block.children].forEach((child, i) => {
    const row = document.createElement('tr');
    if (i === 0 && hasHeader) thead.append(row);
    else tbody.append(row);

    [...child.children].forEach((col) => {
      const cell = buildCell(i, hasHeader);
      cell.innerHTML = col.innerHTML;
      row.append(cell);
    });
  });

  block.textContent = '';
  block.append(table);
}
