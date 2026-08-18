import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';
import { resolveIconsFromContent } from '../../scripts/scripts.js';

export default function decorate(block) {
  // The `points` variant (cloud-page feature rows) carries an authorable EDS
  // icon token (`:name:`) in the image cell rather than a real <picture>. Detect
  // and convert those tokens to `span.icon icon-NAME` so decorateIcons renders
  // them from /icons/, and tag the cell as the image cell. Both environments are
  // handled: a token already expanded to span.icon, or still literal `:name:`.
  const isPoints = block.classList.contains('points');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      // `points` variant: the image cell is the one holding the icon token.
      if (isPoints) {
        let iconSpan = div.querySelector(':scope > span.icon, :scope > p > span.icon');
        if (!iconSpan) {
          const firstP = div.querySelector(':scope > p');
          const m = firstP && firstP.textContent.trim().match(/^:([a-z0-9-]+):$/i);
          if (m) {
            iconSpan = document.createElement('span');
            iconSpan.className = `icon icon-${m[1].toLowerCase()}`;
            firstP.replaceWith(iconSpan);
          }
        } else {
          const wrapperP = iconSpan.closest('p');
          if (wrapperP && wrapperP.textContent.trim() === '') wrapperP.replaceWith(iconSpan);
        }
        if (iconSpan) { div.className = 'cards-icon-card-image'; return; }
      }
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-icon-card-image';
      else div.className = 'cards-icon-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);

  // triad variant: icons are real images (e.g. PNGs). By default they render as
  // authored — no tint imposed. ONLY when an author sets an "Icon color" on the
  // section (the --icon-color custom property) do we recolour: use the image's
  // own alpha as a mask and paint the icon cell with that colour. The <img> then
  // serves only as the mask silhouette and is hidden.
  if (block.classList.contains('triad')) {
    const hasIconColor = getComputedStyle(block).getPropertyValue('--icon-color').trim() !== '';
    if (hasIconColor) {
      ul.querySelectorAll('.cards-icon-card-image img').forEach((img) => {
        const cell = img.closest('.cards-icon-card-image');
        if (!cell) return;
        cell.style.setProperty('--icon-mask', `url("${img.src}")`);
        cell.classList.add('icon-masked');
      });
    }
  }

  // Render any `span.icon` tokens (points variant) into <img> from /icons/, then
  // re-point them at the content-hosted SVGs (falling back to the codebase).
  // By default the icon shows its AUTHORED colour (the fill baked into the SVG) —
  // no tint is imposed. ONLY when an author sets an "Icon color" on the section
  // (exposed as the --icon-color custom property) do we recolour: mask the span
  // with the icon's own src and paint it with that colour.
  if (isPoints) {
    decorateIcons(ul);
    resolveIconsFromContent(ul);
    const hasIconColor = getComputedStyle(block).getPropertyValue('--icon-color').trim() !== '';
    if (hasIconColor) {
      ul.querySelectorAll('span.icon > img').forEach((img) => {
        const span = img.parentElement;
        span.style.setProperty('--icon-mask', `url("${img.src}")`);
        span.classList.add('icon-masked');
      });
    }
  }
}
