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

  // Replace authored icon tokens with inline SVGs so each plan column can
  // color its check independently (an <img> icon can't be recolored via CSS).
  const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  const INFO_SVG = '<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 110c23.2 0 42 18.8 42 42s-18.8 42-42 42-42-18.8-42-42 18.8-42 42-42zm56 254c0 6.6-5.4 12-12 12h-88c-6.6 0-12-5.4-12-12v-24c0-6.6 5.4-12 12-12h12v-64h-12c-6.6 0-12-5.4-12-12v-24c0-6.6 5.4-12 12-12h64c6.6 0 12 5.4 12 12v100h12c6.6 0 12 5.4 12 12v24z"/></svg>';
  table.querySelectorAll('span.icon-check').forEach((span) => {
    span.classList.add('table-compare-check');
    span.innerHTML = CHECK_SVG;
  });
  table.querySelectorAll('span.icon-info').forEach((span) => {
    span.classList.add('table-compare-info');
    span.innerHTML = INFO_SVG;
  });

  block.replaceChildren(table);
}
