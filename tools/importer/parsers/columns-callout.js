/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-callout. Base: columns.
 * Source: https://fiixsoftware.com/cmms/pricing/
 * Instance: `.lite_license`
 * Generated: 2026-07-08
 *
 * Lite License callout, visually two columns: text info (heading + description
 * + note) on the left, CTA button on the right. One content row with 2 cells.
 */
export default function parse(element, { document }) {
  // Text info block (heading + descriptive paragraphs).
  const info = element.querySelector('.lite-info');
  // CTA link (Contact us).
  const cta = element.querySelector('a.demo, a.track, .lite-license > a, a[href]');

  // Empty-block guard.
  if (!info && !cta) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([info || '', cta || '']); // 2-column row: text | CTA.

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-callout', cells });
  element.replaceWith(block);
}
