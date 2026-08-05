/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the premium-support closing CTA (hero-cta). Base: hero (1-column).
 * Source: https://fiixsoftware.com/premium-support/
 * Instance: `.contact-sales`
 * Generated: 2026-08-05
 *
 * Centered closing CTA: H2 + a paragraph with a contact link. The email link
 * is Cloudflare-obfuscated (span.__cf_email__); the visible link already points
 * at /contact-us/#contact-form, so we keep the heading + paragraph as a single
 * 1-column content cell and normalise the obfuscated email span to plain text.
 */
export default function parse(element, { document }) {
  const heading = element.querySelector('h1, h2, h3');
  const paras = Array.from(element.querySelectorAll(':scope > p'));

  // Replace Cloudflare-obfuscated email spans with readable text.
  element.querySelectorAll('.__cf_email__').forEach((span) => {
    span.replaceWith(document.createTextNode('sales@fiixsoftware.com'));
  });

  if (!heading && paras.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const contentCell = [];
  if (heading) contentCell.push(heading);
  paras.forEach((p) => contentCell.push(p));

  const cells = [[contentCell]]; // 1-column row: one cell holds all content.
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-cta', cells });
  element.replaceWith(block);
}
