import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-features-card-image';
      else div.className = 'cards-features-card-body';
    });

    // An authored row can be a spacer (every cell left blank -- keeps
    // column-paired grids aligned when the content count is odd) or a single
    // link standing in for a card (the grid's trailing call-to-action).
    // Both still need to occupy their grid slot, so tag the row rather than
    // dropping it.
    const hasImage = li.querySelector('.cards-features-card-image');
    const links = [...li.querySelectorAll('a')];
    const text = li.textContent.trim();
    if (!hasImage && text === '' && links.length === 0) {
      li.classList.add('cards-features-empty');
    } else if (!hasImage && links.length === 1 && text === links[0].textContent.trim()) {
      li.classList.add('cards-features-cta');
    }

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });

  // Production renders a trailing "Featured" / "New" word in a card heading as a
  // small badge (e.g. "Fiix Foresight [FEATURED]"). The authored text has it as
  // plain text, so wrap it in a span the CSS can style as that badge.
  ul.querySelectorAll('.cards-features-card-body h3').forEach((h3) => {
    const m = h3.textContent.match(/^(.*\S)\s+(Featured|New)\s*$/i);
    if (!m) return;
    const [, heading, badge] = m;
    h3.textContent = `${heading} `;
    const label = document.createElement('span');
    label.className = 'cards-features-label';
    label.textContent = badge;
    h3.append(label);
  });

  // pf-features lays the blurbs out COLUMN-major (fill the left column
  // top-to-bottom, then the right) like production. CSS grid is row-major by
  // default, so tag the row count (= half, rounded up) for the stylesheet to
  // switch to column auto-flow at desktop.
  if (block.closest('.pf-features')) {
    ul.classList.add(`cards-features-rows-${Math.ceil(ul.children.length / 2)}`);
  }

  // Text-only feature grids (e.g. free-cmms) lay the blurbs out COLUMN-major
  // (fill the left column top-to-bottom, then the right), like production.
  if (!block.querySelector('.cards-features-card-image')) {
    ul.classList.add(`cards-features-rows-${Math.ceil(ul.children.length / 2)}`);
  }

  block.textContent = '';
  block.append(ul);
}
