/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-logos. Base: columns.
 * Source: https://fiixsoftware.com/cmms/pricing/
 * Instances: `.pricing_header .awards` (award badge strip), `.fiix-users` (customer logo strip)
 * Generated: 2026-07-08
 *
 * The block is a horizontal strip of logo images. Each image becomes its own
 * column in a single content row (columns block: cells per row = column count).
 */
export default function parse(element, { document }) {
  // Award instance uses <figure><img>; customer instance uses <ul><li><img>.
  // Collect all logo images regardless of wrapper.
  const images = Array.from(element.querySelectorAll('img'));

  // Empty-block guard: nothing to render without images.
  if (images.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  // Single content row: one cell per image so each renders as a column.
  cells.push(images.map((img) => img));

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-logos', cells });
  element.replaceWith(block);
}
