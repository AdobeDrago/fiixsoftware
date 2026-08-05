/* eslint-disable */
/* global WebImporter */
/**
 * Parser for premium-support benefit cards (cards-icon). Base: cards.
 * Source: https://fiixsoftware.com/premium-support/
 * Instance: `.started .cont.training`
 * Generated: 2026-08-05
 *
 * Four value-prop cards. Each direct child div holds a `<figure><img>` icon,
 * an <h3> title, and a <p> description. 2-column table: cell 1 = icon image,
 * cell 2 = title + description. The badge image and section <h2> above the
 * cards are default content, handled elsewhere.
 */
export default function parse(element, { document }) {
  const grid = element.querySelector('.cont.training, .cont') || element;
  const cards = Array.from(grid.querySelectorAll(':scope > div'));

  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cards.forEach((card) => {
    const icon = card.querySelector('figure img, figure picture, img');
    const textCell = [];
    const heading = card.querySelector('h1, h2, h3, h4');
    if (heading) textCell.push(heading);
    Array.from(card.querySelectorAll(':scope > p')).forEach((p) => textCell.push(p));
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
