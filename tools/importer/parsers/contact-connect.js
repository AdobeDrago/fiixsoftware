/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the contact-us "connect with" cards (cards-icon). Base: cards.
 * Source: https://fiixsoftware.com/contact-us/
 * Instance: `.page-container`
 * Generated: 2026-08-05
 *
 * Four contact channel cards. Each `.col` holds a `<figure><img>` icon, an
 * <h3> title, and a <p> description (with links preserved). 2-column table:
 * cell 1 = icon image, cell 2 = title + description. The section <h2>
 * ("Who would you like to connect with?") is default content, handled elsewhere.
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.col'));

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

  // Preserve the section heading ("Who would you like to connect with?") as
  // default content above the cards block — it is a direct child of the
  // section element that replaceWith would otherwise discard.
  const sectionHeading = element.querySelector(':scope > h1, :scope > h2');
  if (sectionHeading) {
    element.replaceWith(sectionHeading, block);
  } else {
    element.replaceWith(block);
  }
}
