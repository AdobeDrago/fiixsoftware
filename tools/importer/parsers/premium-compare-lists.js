/* eslint-disable */
/* global WebImporter */
/**
 * Parser for "Premium vs Standard" lists (columns-media). Base: columns.
 * Source: https://fiixsoftware.com/premium-support/
 * Instance: `.support-scaling.support-flex .support-options`
 * Generated: 2026-08-05
 *
 * Two side-by-side option columns (Standard / Premium), each with an <h4>
 * title, an intro <p>, a feature <ul>, and (Premium) a CTA link. Emits a
 * single two-cell columns-media row preserving both columns. The section <h2>
 * ("Premium Support vs Standard Support") is default content, handled elsewhere.
 */
export default function parse(element, { document }) {
  const options = element.querySelector('.support-options') || element;
  const columns = Array.from(options.querySelectorAll(':scope > div'))
    .filter((c) => c.textContent.trim().length > 0);

  if (columns.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [columns.map((col) => col)];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
