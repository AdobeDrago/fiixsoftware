/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-media (enterprise variant). Base: columns.
 * Source: https://fiixsoftware.com/enterprise/
 * Instances:
 *   `.scale .organized`            → text + dashboard image (order alternates)
 *   `.operation .product-flex`     → feature checklist + screenshot image
 *   `.success .success-flex`       → intro copy + CTA and a checklist <ul>
 *   `.social-proof #feature-container-ent` → company logo + testimonial quote
 * Generated: 2026-08-05
 *
 * Two-column media/copy layout. The source places two sibling blocks — one is
 * the imagery (a <figure>/<img>), the other is the copy — and their left/right
 * order varies (a `.order`/`.fingertips` modifier flips them). We emit exactly
 * two cells preserving the source DOM order so the layout matches production.
 */
export default function parse(element, { document }) {
  // The two columns are the element's direct children (skip empties/comments).
  let columns = Array.from(element.children).filter(
    (c) => c.nodeType === 1 && c.textContent.trim().length + c.querySelectorAll('img').length > 0,
  );

  // Some instances wrap the two columns one level deeper (e.g. a lone inner div).
  if (columns.length === 1 && columns[0].children.length >= 2) {
    columns = Array.from(columns[0].children).filter(
      (c) => c.nodeType === 1 && c.textContent.trim().length + c.querySelectorAll('img').length > 0,
    );
  }

  // Normalise lazy-loaded images so their URLs are captured for upload.
  element.querySelectorAll('img').forEach((img) => {
    if (!img.getAttribute('src')) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      if (lazy) img.setAttribute('src', lazy);
    }
  });

  if (columns.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Build one row with a cell per column, preserving source order.
  const row = columns.map((col) => {
    // If the column is purely a figure/image wrapper, pass the image itself.
    const onlyImg = col.querySelector('img');
    const hasText = col.textContent.trim().length > 0;
    if (onlyImg && !hasText) return onlyImg;
    return col;
  });

  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
