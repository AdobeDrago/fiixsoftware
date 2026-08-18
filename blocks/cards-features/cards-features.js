import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';
import { resolveIconsFromContent } from '../../scripts/scripts.js';

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

  // Text-only feature grids (e.g. free-cmms) lay the blurbs out COLUMN-major and,
  // when the author has added a feature icon to the cards, render it to the left
  // of the heading. The icon is ordinary authored content — an EDS icon token
  // (`<span class="icon icon-NAME">`, decorated into an <img> by decorateIcons in
  // scripts.js). We don't hard-code which icon goes where; we just detect that a
  // card carries one and tag the block/card so the CSS can lay it out.
  if (!block.querySelector('.cards-features-card-image')) {
    let iconated = 0;
    ul.querySelectorAll('.cards-features-card-body').forEach((body) => {
      // The author places an EDS icon token (`:name:`) as the first line of the
      // cell. It may already be a span.icon (if the pipeline expanded it) or
      // still be literal text in a leading <p>. Handle both so the icon renders
      // regardless of environment.
      let iconSpan = body.querySelector(':scope > span.icon, :scope > p > span.icon');
      if (!iconSpan) {
        const firstP = body.querySelector(':scope > p');
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
      if (!iconSpan) return;
      iconSpan.classList.add('cards-features-icon');
      body.prepend(iconSpan);
      iconated += 1;
    });
    if (iconated) {
      block.classList.add('cards-features-iconed');
      decorateIcons(ul); // turn span.icon tokens into <img> from /icons/ (ul holds the cards)
      // Re-point the icon <img>s at the content-hosted SVGs (falls back to the
      // codebase /icons/ if unpublished), so icons live in content not code.
      resolveIconsFromContent(ul);
      // By default the icon shows its AUTHORED colour (baked into the SVG) — no
      // tint imposed. ONLY when an author sets an "Icon color" on the section
      // (the --icon-color custom property) do we recolour: mask the span with the
      // icon's resolved src and paint it with that colour.
      const hasIconColor = getComputedStyle(block).getPropertyValue('--icon-color').trim() !== '';
      if (hasIconColor) {
        ul.querySelectorAll('span.icon > img').forEach((img) => {
          const span = img.parentElement;
          span.style.setProperty('--icon-mask', `url("${img.src}")`);
          span.classList.add('icon-masked');
        });
      }
    }
    // Column-major flow (fill left column top-to-bottom, then right) like prod.
    ul.classList.add(`cards-features-rows-${Math.ceil(ul.children.length / 2)}`);
  }

  block.textContent = '';
  block.append(ul);
}
