import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-pricing-card-image';
      else div.className = 'cards-pricing-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
  // A price h3 that isn't a numeric amount (e.g. "Custom Pricing") renders as
  // a small label on production, not the big price number.
  ul.querySelectorAll('.cards-pricing-card-body h3').forEach((h3) => {
    if (!/^\s*\$?\d/.test(h3.textContent)) h3.classList.add('cards-pricing-price-text');
  });
  block.textContent = '';
  block.append(ul);
}
