/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-compare. Base: table.
 * Source: https://fiixsoftware.com/cmms/pricing/
 * Instance: `#compare .feature-table-t`
 * Generated: 2026-07-08
 *
 * Feature comparison matrix. 5 columns: feature label + 4 plan columns
 * (Free, Basic, Professional, Enterprise). Source table structure:
 *   - an empty header row (plan names not present in source markup)
 *   - category rows: a single <th class="trigger-pricing"> label
 *   - feature rows: 5 <td> cells — label + one cell per plan, where each plan
 *     cell holds a check icon (included) or is empty (not included).
 *
 * The parser normalises every content row to 5 cells (padding category rows),
 * converts check icons to a "✓" marker, and strips sr-only text and icons.
 */
export default function parse(element, { document }) {
  const PLAN_NAMES = ['Free', 'Basic', 'Professional', 'Enterprise'];
  const COLS = PLAN_NAMES.length + 1; // feature label + 4 plans.

  const table = element.querySelector('table');
  if (!table) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const sourceRows = Array.from(table.querySelectorAll(':scope > tbody > tr, :scope > thead > tr'));
  if (sourceRows.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Header row: empty feature-label cell + plan names.
  const headerRow = [''];
  PLAN_NAMES.forEach((name) => {
    const strong = document.createElement('strong');
    strong.textContent = name;
    headerRow.push(strong);
  });
  cells.push(headerRow);

  const makeMarker = () => {
    const span = document.createElement('span');
    span.textContent = '✓';
    return span;
  };

  sourceRows.forEach((tr) => {
    const rowCells = Array.from(tr.children);

    // Skip the source's empty leading header row (single empty <th>).
    if (rowCells.length === 1 && rowCells[0].textContent.trim() === '') return;

    // Category row: single label cell (e.g. "Work order management").
    if (rowCells.length === 1) {
      const label = rowCells[0].textContent.trim();
      const strong = document.createElement('strong');
      strong.textContent = label;
      const row = [strong];
      while (row.length < COLS) row.push('');
      cells.push(row);
      return;
    }

    // Feature row: first cell is the label, remaining cells are per-plan.
    const row = [];

    // Feature label — preserve link text without the popup anchor wrapper.
    const labelCell = rowCells[0];
    const labelText = labelCell.textContent.replace(/\s+/g, ' ').trim();
    row.push(labelText || '');

    // Plan cells: check icon -> ✓ marker, otherwise empty.
    for (let i = 1; i < COLS; i += 1) {
      const planCell = rowCells[i];
      if (planCell && planCell.querySelector('i.fa-check, [class*="fa-check"]')) {
        row.push(makeMarker());
      } else {
        row.push('');
      }
    }

    // Pad short rows to keep column count consistent.
    while (row.length < COLS) row.push('');
    cells.push(row);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-compare', cells });
  element.replaceWith(block);
}
