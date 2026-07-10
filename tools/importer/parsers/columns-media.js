/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-media. Base: columns.
 * Source: https://fiixsoftware.com/cmms/pricing/
 * Instance: `.pricing-connectusers`
 * Generated: 2026-07-08
 *
 * Media + copy layout, two columns: illustration image on one side, text
 * content (heading + description + CTA) on the other. A hidden Marketo contact
 * form modal (`.white-popup.mfp-hide`) is present in the source and excluded.
 */
export default function parse(element, { document }) {
  // Image column (single illustration). The image lives outside the
  // `.pricing-connectusers-content` text block and outside the hidden popup.
  // Search broadly but exclude the Marketo modal, and normalise lazy-loaded
  // sources (data-src) so the URL is captured.
  const popup = element.querySelector('.white-popup, .mfp-hide');
  let image = Array.from(element.querySelectorAll('img, picture'))
    .find((el) => !popup || !popup.contains(el)) || null;

  if (image) {
    const img = image.tagName === 'IMG' ? image : image.querySelector('img');
    if (img && !img.getAttribute('src')) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      if (lazy) img.setAttribute('src', lazy);
    }
  }

  // Text column: heading + description + CTA.
  const content = element.querySelector('.pricing-connectusers-content');

  const cellContent = [];
  if (content) {
    // Preserve heading, paragraphs, and CTA link as-is.
    Array.from(content.children).forEach((child) => cellContent.push(child));
  }

  // Empty-block guard.
  if (!image && cellContent.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([image || '', cellContent.length ? cellContent : '']); // 2-column: image | text.

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
