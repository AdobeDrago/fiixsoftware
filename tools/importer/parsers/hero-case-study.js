/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-case-study. Base: hero (1-column block; cached convention: 3
 * rows — block name, optional background image (row 2), then Title + Subheading
 * + CTA (row 3)).
 * Source: https://fiixsoftware.com/resource-center/case-studies/universal-pure/
 *   `div.case-studies-temp.cloeren > header` — a purple banner <img> background,
 *   an <h1> (customer name), an <h2> (headline), and a "Back to case studies"
 *   link inside a <p>.
 * Generated: 2026-08-17.
 *
 * 1-column hero structure:
 *   Row 2 (optional): background banner image.
 *   Row 3: content cell — H1 title + H2 subheading + back-link CTA.
 */
export default function parse(element, { document }) {
  // Background banner image (first img in the header).
  const image = element.querySelector(':scope > img, img, picture');

  // Text content lives in the inner wrapper div (fallback to the header itself).
  const inner = element.querySelector(':scope > div') || element;
  const title = inner.querySelector('h1, h2, h3');
  const subheading = inner.querySelector('h1 ~ h2, h2 ~ h3');
  const cta = inner.querySelector('a[href]');
  // Strip screen-reader-only noise from the CTA if present (matches other parsers).
  if (cta) cta.querySelectorAll('.sr-only').forEach((s) => s.remove());

  // Empty-block guard.
  if (!title && !subheading && !cta && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: optional background banner image (own 1-cell row).
  if (image) cells.push([image]);

  // Row 3: content cell holding title + subheading + CTA (single cell).
  const contentCell = [];
  if (title) contentCell.push(title);
  if (subheading && subheading !== title) contentCell.push(subheading);
  // The CTA usually sits inside its own <p>; keep the paragraph wrapper if present
  // so the link renders as a distinct button/line.
  if (cta) {
    const ctaWrap = cta.closest('p');
    contentCell.push(ctaWrap && inner.contains(ctaWrap) ? ctaWrap : cta);
  }
  cells.push([contentCell]); // 1-column row: one cell holds all content.

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-case-study', cells });
  element.replaceWith(block);
}
