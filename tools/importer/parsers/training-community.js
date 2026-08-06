/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the Fiixers community section (columns-media). Base: columns.
 * Source: https://fiixsoftware.com/training-and-implementation/
 * Instance: `.scaling-success`
 * Generated: 2026-08-05
 *
 * Two-column layout inside `.get-help`: a community screenshot image and a copy
 * column (heading + checklist <ul> + "Join" CTA). The checklist items use empty
 * checkmark <figure> images; they are kept as list text. Emits [image, content].
 */
export default function parse(element, { document }) {
  const wrap = element.querySelector('.get-help') || element;
  const children = Array.from(wrap.children).filter((c) => c.nodeType === 1);

  // The image is a top-level <figure>/<img>; the rest is the copy column.
  const imageEl = wrap.querySelector(':scope > figure img, :scope > figure picture, :scope > img');
  const contentWrap = children.find((c) => c.querySelector && c.querySelector('h1, h2, h3, ul'))
    || children.find((c) => c !== imageEl && c.tagName !== 'FIGURE');

  const contentCell = [];
  if (contentWrap) {
    Array.from(contentWrap.children).forEach((child) => {
      if (child.textContent.trim() || child.querySelector('a')) contentCell.push(child);
    });
  }

  if (!imageEl && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[imageEl || '', contentCell.length ? contentCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
