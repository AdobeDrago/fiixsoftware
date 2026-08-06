/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the Support Standard/Premium lists (columns-media). Base: columns.
 * Source: https://fiixsoftware.com/training-and-implementation/
 * Instance: `.support-scaling .support-options`
 * Generated: 2026-08-05
 *
 * Two side-by-side option columns (Standard / Premium), each with an <h4>
 * title, an intro <p>, a feature <ul>, and a CTA link. Emits a single
 * two-cell columns-media row preserving both columns. The section intro
 * (`.flex-intro` "Support" heading + copy) is default content, handled
 * elsewhere, and the comparison <table> is a separate table-compare block.
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
