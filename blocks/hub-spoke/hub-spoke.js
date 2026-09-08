import { createOptimizedPicture } from '../../scripts/aem.js';

function cellFromRow(row) {
  return row?.querySelector('p') || row?.firstElementChild;
}

function appendSide(grid, items, side, midRow) {
  items.forEach((cell, i) => {
    cell.classList.add('hub-spoke-item', `hub-spoke-item-${side}`);
    if (i === midRow) cell.classList.add('hub-spoke-item-outer');
    if (i === 0 || i === items.length - 1) cell.classList.add('hub-spoke-item-edge');
    cell.style.gridRow = String(i + 1);
    grid.append(cell);
  });
}

/**
 * Authoring contract:
 * Row 1: icon image (shown inside the center circle)
 * Row 2: center heading text
 * Row 3+: one point per row, alternating left / right around the circle
 *
 * @param {Element} block The hub-spoke block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const iconRow = rows.shift();
  const headingRow = rows.shift();

  const circle = document.createElement('div');
  circle.className = 'hub-spoke-circle';

  const img = iconRow?.querySelector('img');
  if (img) {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]);
    const icon = document.createElement('div');
    icon.className = 'hub-spoke-icon';
    icon.append(optimizedPic);
    circle.append(icon);
  }

  const heading = cellFromRow(headingRow);
  if (heading) {
    heading.classList.add('hub-spoke-heading');
    circle.append(heading);
  }

  const points = rows.map(cellFromRow).filter((cell) => cell && cell.textContent.trim());
  const left = points.filter((_, i) => i % 2 === 0);
  const right = points.filter((_, i) => i % 2 === 1);
  const rowCount = Math.max(left.length, right.length, 1);
  const midRow = Math.floor((rowCount - 1) / 2);

  const grid = document.createElement('div');
  grid.className = 'hub-spoke-grid';
  circle.style.gridRow = `1 / span ${rowCount}`;
  grid.append(circle);
  appendSide(grid, left, 'left', midRow);
  appendSide(grid, right, 'right', midRow);

  block.textContent = '';
  block.append(grid);
}
