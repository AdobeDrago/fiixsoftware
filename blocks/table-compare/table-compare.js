/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

/**
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const header = !block.classList.contains('no-header');

  [...block.children].forEach((row, i) => {
    const tr = document.createElement('tr');
    const cells = [...row.children];

    // A section-header row has a bold label in the first cell (e.g.
    // "Work order management") and every other cell empty. Render it as one
    // full-width band. The bold marker distinguishes it from feature rows.
    const isSectionHeader = i !== 0
      && cells.length > 1
      && cells[0].querySelector('strong') !== null
      && cells.slice(1).every((c) => c.textContent.trim() === '');

    if (isSectionHeader) {
      const td = document.createElement('td');
      td.setAttribute('colspan', String(cells.length));
      td.innerHTML = cells[0].innerHTML;
      tr.classList.add('table-compare-section');
      tr.append(td);
      tbody.append(tr);
      return;
    }

    cells.forEach((cell) => {
      const td = document.createElement(i === 0 && header ? 'th' : 'td');

      if (i === 0) td.setAttribute('scope', 'column');
      td.innerHTML = cell.innerHTML;
      tr.append(td);
    });
    if (i === 0 && header) thead.append(tr);
    else tbody.append(tr);
  });
  table.append(thead, tbody);
  block.replaceChildren(table);
}
