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

  // Wrap h3 (price) + following p elements (subtext) in a flex container
  // to render them inline (matching WP production layout: "$0  Limited users.")
  ul.querySelectorAll('.cards-pricing-card-body h3').forEach((h3) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'cards-pricing-price-row';
    h3.parentNode.insertBefore(wrapper, h3);
    wrapper.append(h3);
    // Collect subsequent p elements until we hit a button-wrapper or another heading
    let next = wrapper.nextElementSibling;
    while (next && next.tagName === 'P' && !next.classList.contains('button-wrapper')) {
      const toMove = next;
      next = next.nextElementSibling;
      wrapper.append(toMove);
    }
  });

  block.textContent = '';
  block.append(ul);
}
