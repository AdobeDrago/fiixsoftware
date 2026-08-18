import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

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

  // Render any `span.icon` tokens (points variant) into <img> from /icons/.
  if (isPoints) decorateIcons(ul);
}
