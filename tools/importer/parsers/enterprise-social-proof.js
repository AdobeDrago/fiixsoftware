/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the social-proof testimonial (enterprise). Base: columns (columns-media).
 * Source: https://fiixsoftware.com/enterprise/
 * Instance: `.social-proof #feature-container-ent`
 * Generated: 2026-08-05
 *
 * The source is an interactive feature-selector: a `.feature-selector` figure
 * holding several company logos (only one visible at a time) and a <section>
 * with matching `.feature-item .item` quote panels. For a faithful static match
 * we render the default/active testimonial (Liberty Oilfield): the active logo
 * in cell 1 and the active quote panel's paragraphs in cell 2 (a 2-column
 * columns-media row). The section <h2> is default content (handled elsewhere).
 */
export default function parse(element, { document }) {
  // Active logo (falls back to first logo image).
  const logo = element.querySelector('.feature-selector img.active')
    || element.querySelector('.feature-selector img');

  // Active quote panel (falls back to first).
  const activeItem = element.querySelector('.feature-item .item.active')
    || element.querySelector('.feature-item .item');

  const contentCell = [];
  if (activeItem) {
    Array.from(activeItem.querySelectorAll(':scope > p')).forEach((p) => contentCell.push(p));
  }

  if (!logo && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[logo || '', contentCell.length ? contentCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
