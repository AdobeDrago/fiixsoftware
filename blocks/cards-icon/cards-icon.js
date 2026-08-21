import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

const ICON_TOKEN_RE = /^:([a-z0-9-]+):$/i;

export default function decorate(block) {
  // The `points` variant (cloud-page feature rows) accepts either an authorable
  // EDS icon token (`:name:`) or a directly authored image in the image cell,
  // and renders each with its own treatment (small tinted icon vs larger centred
  // photo) -- no separate block variant needed per content type. Detect and
  // convert an icon token to `span.icon icon-NAME` so decorateIcons renders it
  // from /icons/; both environments are handled: a token already expanded to
  // span.icon, or still literal `:name:`.
  const isPoints = block.classList.contains('points');

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      // `points` variant: the image cell holds either an icon token or a photo.
      if (isPoints) {
        let iconSpan = div.querySelector(':scope > span.icon, :scope > p > span.icon');
        if (!iconSpan) {
          const firstP = div.querySelector(':scope > p');
          const m = firstP && firstP.textContent.trim().match(ICON_TOKEN_RE);
          if (m) {
            iconSpan = document.createElement('span');
            iconSpan.className = `icon icon-${m[1].toLowerCase()}`;
            firstP.replaceWith(iconSpan);
          }
        } else {
          const wrapperP = iconSpan.closest('p');
          if (wrapperP && wrapperP.textContent.trim() === '') wrapperP.replaceWith(iconSpan);
        }
        if (iconSpan) { div.className = 'cards-icon-card-image cards-icon-card-image-icon'; return; }
        if (div.children.length === 1 && div.querySelector('picture')) {
          div.className = 'cards-icon-card-image cards-icon-card-image-photo';
          return;
        }
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

  if (!isPoints) return;

  // Render any newly-created `span.icon` tokens into <img> from /icons/ (a
  // no-op for spans the page's own global decorateIcons pass already handled).
  decorateIcons(ul);

  // By default both icon types render as authored (an icon's own SVG fill, or a
  // photo's own colours) -- no tint imposed. ONLY when an author sets an "Icon
  // color" on the section (the --icon-color custom property) do we recolour,
  // using each icon's own alpha as a mask and painting with that colour. The
  // source <img>/<span> then serves only as the mask silhouette and is hidden.
  const hasIconColor = getComputedStyle(block).getPropertyValue('--icon-color').trim() !== '';
  if (!hasIconColor) return;

  ul.querySelectorAll('.cards-icon-card-image-photo img').forEach((img) => {
    const cell = img.closest('.cards-icon-card-image');
    cell.style.setProperty('--icon-mask', `url("${img.src}")`);
    cell.classList.add('icon-masked');
  });

  ul.querySelectorAll('.cards-icon-card-image-icon .icon > img').forEach((img) => {
    const span = img.parentElement;
    span.style.setProperty('--icon-mask', `url("${img.src}")`);
    span.classList.add('icon-masked');
  });
}
