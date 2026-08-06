/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the "Why join?" benefit cards (cards-icon). Base: cards.
 * Source: https://fiixsoftware.com/community/
 * Instance: `.join-flex`
 * Generated: 2026-08-06
 *
 * Four icon cards. Each `.item` holds a `<figure><img>` icon and a <p> (with a
 * <strong> benefit statement). 2-column table: cell 1 = icon image, cell 2 =
 * the benefit text. The section <h2> ("Why join?") is default content,
 * handled elsewhere.
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll(':scope > .item, .item'));

  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cards.forEach((card) => {
    const icon = card.querySelector('figure img, figure picture, img');
    const textCell = [];
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
