/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the community closing CTA (hero-cta). Base: hero (1-column).
 * Source: https://fiixsoftware.com/community/
 * Instance: `.get-started`
 * Generated: 2026-08-06
 *
 * Centered closing CTA: H2 + a copy paragraph + a "Join now" CTA link. Emits a
 * single 1-column content cell holding the heading, copy, and CTA.
 */
export default function parse(element, { document }) {
  const container = element.querySelector('.container') || element;
  const heading = container.querySelector('h1, h2, h3');
  const paras = Array.from(container.querySelectorAll(':scope > p'));

  if (!heading && paras.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const contentCell = [];
  if (heading) contentCell.push(heading);
  paras.forEach((p) => contentCell.push(p));

  const cells = [[contentCell]]; // 1-column row.
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-cta', cells });
  element.replaceWith(block);
}
