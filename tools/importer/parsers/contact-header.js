/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the contact-us header (columns-media). Base: columns.
 * Source: https://fiixsoftware.com/contact-us/
 * Instance: `.contact-header`
 * Generated: 2026-08-05
 *
 * Two-column hero: text column (.header-content — H1 + subhead + two CTA
 * links) and an image column (.header-logo figure/img). A hidden Marketo
 * popup form (#contact-form.white-popup.mfp-hide) lives inside .header-content
 * and is excluded. Emits a single columns-media row: [text, logo image].
 */
export default function parse(element, { document }) {
  const content = element.querySelector('.header-content');
  const logo = element.querySelector('.header-logo img, .header-logo picture, .header-logo figure img');

  const textCell = [];
  if (content) {
    // Drop the hidden Marketo popup so only visible copy/CTAs remain.
    const popup = content.querySelector('.white-popup, .mfp-hide, #contact-form');
    if (popup) popup.remove();
    Array.from(content.children).forEach((child) => {
      if (child.textContent.trim() || child.querySelector('a, img')) textCell.push(child);
    });
  }

  if (textCell.length === 0 && !logo) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell.length ? textCell : '', logo || '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
