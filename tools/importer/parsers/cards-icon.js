/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-icon. Base: cards (with icon → 2 columns per row).
 * Source: https://fiixsoftware.com/cmms/pricing/
 * Instance: `.succeed-container`
 * Generated: 2026-07-08
 *
 * Customer-success icon items. Each `<dl>` is one card:
 *   <dt><img> = icon, first <dd> = title, remaining <dd> = description.
 * 2-column table: cell 1 = icon image, cell 2 = title + description.
 * The section <h2> is default content (handled elsewhere) and is not included.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('dl'));

  // Empty-block guard.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  items.forEach((dl) => {
    const icon = dl.querySelector('dt img, dt picture, img');
    const defs = Array.from(dl.querySelectorAll('dd'));

    const textCell = [];
    if (defs.length > 0) {
      // First <dd> is the title → promote to a heading for card styling.
      const title = document.createElement('h3');
      title.innerHTML = defs[0].innerHTML;
      textCell.push(title);
      // Remaining <dd> are description paragraphs.
      defs.slice(1).forEach((dd) => {
        const p = document.createElement('p');
        p.innerHTML = dd.innerHTML;
        textCell.push(p);
      });
    }

    if (!icon && textCell.length === 0) return;
    cells.push([icon || '', textCell.length ? textCell : '']); // 2-column: icon | text.
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon', cells });
  element.replaceWith(block);
}
