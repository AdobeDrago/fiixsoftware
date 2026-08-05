/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-icon (enterprise tools variant). Base: cards (icon → 2 cols).
 * Source: https://fiixsoftware.com/enterprise/
 * Instance: `.tools .ent-flex`
 * Generated: 2026-08-05
 *
 * Product cards. Each `.cont` holds a `<figure><img>` icon plus a text `<div>`
 * with an <h3> title, a <p> description, and an "Explore now" CTA link.
 * 2-column table: cell 1 = icon image, cell 2 = title + description + CTA.
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll(':scope > .cont, :scope > div'));

  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  cards.forEach((card) => {
    const icon = card.querySelector('figure img, figure picture, img');
    const textWrap = card.querySelector(':scope > div') || card;

    const textCell = [];
    const heading = textWrap.querySelector('h1, h2, h3, h4');
    if (heading) textCell.push(heading);
    Array.from(textWrap.querySelectorAll(':scope > p')).forEach((p) => textCell.push(p));
    const cta = textWrap.querySelector('a[href]');
    if (cta) textCell.push(cta);

    if (!icon && textCell.length === 0) return;
    cells.push([icon || '', textCell.length ? textCell : '']);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon', cells });
  element.replaceWith(block);
}
