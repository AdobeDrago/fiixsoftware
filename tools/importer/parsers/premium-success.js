/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the TI Automotive success story (columns-media). Base: columns.
 * Source: https://fiixsoftware.com/premium-support/
 * Instance: `.get-started`
 * Generated: 2026-08-05
 *
 * Two-column success story: an info column (eyebrow "Success story", H2, quote,
 * attribution) and a stats check-list column. The decorative accent hexagon and
 * the video-container graphic are aria-hidden presentation images and dropped.
 * Empty `.check` marker spans (CSS icons) are removed so only text survives.
 */
export default function parse(element, { document }) {
  const info = element.querySelector('.info-container');
  const list = element.querySelector('.check-list, ul');

  const infoCell = [];
  if (info) {
    Array.from(info.children).forEach((child) => {
      if (child.textContent.trim() || child.querySelector('a')) infoCell.push(child);
    });
  }

  const listCell = [];
  if (list) {
    // Strip empty check marker spans; keep the text spans.
    list.querySelectorAll('span.check, span:empty').forEach((s) => s.remove());
    listCell.push(list);
  }

  if (infoCell.length === 0 && listCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[infoCell.length ? infoCell : '', listCell.length ? listCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
