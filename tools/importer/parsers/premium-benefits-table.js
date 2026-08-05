/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the "Exclusive benefits" comparison table (table-compare).
 * Source: https://fiixsoftware.com/premium-support/
 * Instance: `.support-scaling` (the section containing the benefits <table>)
 * Generated: 2026-08-05
 *
 * 3-column comparison: feature label + Premium + Standard. Source rows:
 *   - header rows (<th> Technical support | Premium | Standard) — some sections
 *     repeat a category header spanning the row.
 *   - feature rows: <td> label (with an fa icon + text) + two plan <td>s. Each
 *     plan cell carries an sr-only helper string — "<plan> includes …" when the
 *     feature is available or "<plan> does not include …" when it is not. The
 *     EDS import strips the decorative `<i>` check icons, so availability is
 *     read from that sr-only text, not the icon.
 * The parser normalises to 3 cells/row, emits "✓" for included plan cells, and
 * strips icons + sr-only helper text from the visible output.
 */
export default function parse(element, { document }) {
  const COLS = 3; // feature label + Premium + Standard.
  const table = element.querySelector('table');
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const rows = Array.from(table.querySelectorAll(':scope > tbody > tr, :scope > thead > tr, :scope > tr'));
  if (rows.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const makeMarker = () => {
    const span = document.createElement('span');
    span.textContent = '✓';
    return span;
  };

  // Visible label text for a cell: drop sr-only helper spans and icon glyphs.
  const labelText = (cell) => {
    const clone = cell.cloneNode(true);
    clone.querySelectorAll('.sr-only, i, span:empty').forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  };

  const cells = [];

  rows.forEach((tr) => {
    const rowCells = Array.from(tr.children);
    if (rowCells.length === 0) return;

    // Header/category row of <th>s: keep as bold labels across the columns.
    const isHeader = rowCells.every((c) => c.tagName === 'TH');
    if (isHeader) {
      const row = rowCells.slice(0, COLS).map((c) => {
        const strong = document.createElement('strong');
        strong.textContent = labelText(c);
        return strong;
      });
      while (row.length < COLS) row.push('');
      cells.push(row);
      return;
    }

    // Feature row: label + two plan cells. Availability is read from each
    // plan cell's sr-only helper text (the check <i> is stripped by the
    // pipeline): "… includes …" → ✓, "… does not include …" → empty. Fall
    // back to the check icon if the sr-only text is absent.
    const row = [labelText(rowCells[0]) || ''];
    for (let i = 1; i < COLS; i += 1) {
      const planCell = rowCells[i];
      let included = false;
      if (planCell) {
        const sr = planCell.querySelector('.sr-only');
        if (sr) {
          included = !/does not include/i.test(sr.textContent);
        } else {
          included = !!planCell.querySelector('i.fa-check, [class*="fa-check"]');
        }
      }
      row.push(included ? makeMarker() : '');
    }
    while (row.length < COLS) row.push('');
    cells.push(row);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-compare', cells });
  element.replaceWith(block);
}
