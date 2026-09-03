import { createOptimizedPicture } from '../../scripts/aem.js';

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

  const heading = headingRow?.querySelector('p') || headingRow;
  if (heading) {
    heading.classList.add('hub-spoke-heading');
    circle.append(heading);
  }

  const points = rows
    .map((row) => row.querySelector('p') || row)
    .filter((p) => p && p.textContent.trim());

  const left = points.filter((_, i) => i % 2 === 0);
  const right = points.filter((_, i) => i % 2 === 1);
  const rowCount = Math.max(left.length, right.length, 1);

  const grid = document.createElement('div');
  grid.className = 'hub-spoke-grid';

  circle.style.gridRow = `1 / span ${rowCount}`;
  grid.append(circle);

  // The row level with the circle (its widest point) sits furthest out;
  // rows above/below it sit closer in, tracing the circle's curve.
  const midRow = Math.floor((rowCount - 1) / 2);

  left.forEach((p, i) => {
    p.classList.add('hub-spoke-item', 'hub-spoke-item-left');
    if (i === midRow) p.classList.add('hub-spoke-item-outer');
    if (i === 0 || i === left.length - 1) p.classList.add('hub-spoke-item-edge');
    p.style.gridRow = String(i + 1);
    grid.append(p);
  });

  right.forEach((p, i) => {
    p.classList.add('hub-spoke-item', 'hub-spoke-item-right');
    if (i === midRow) p.classList.add('hub-spoke-item-outer');
    if (i === 0 || i === right.length - 1) p.classList.add('hub-spoke-item-edge');
    p.style.gridRow = String(i + 1);
    grid.append(p);
  });

  block.textContent = '';
  block.append(grid);
}
