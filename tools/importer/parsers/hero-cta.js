/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-cta. Base: hero (1-column block; cached convention: 3 rows —
 * block name, optional background image (row 2), then Title + Subheading + CTA
 * (row 3)).
 * Sources:
 *   https://fiixsoftware.com/cmms/pricing/ — `.pricing-kickthetires`
 *   https://fiixsoftware.com/enterprise/   — `.demo`
 *   marketing-landing https://fiixsoftware.com/optix/ — `section.get-started`
 *     (the instance selector targets the `.get-started` div directly, which the
 *     `|| element` fallback handles): centered image + H2 + paragraph + CTA.
 * Generated: 2026-07-08 · Updated: 2026-08-11 (marketing-landing get-started CTA).
 *
 * Closing CTA banner. 1-column hero structure:
 *   Row 2 (optional): background/decorative image.
 *   Row 3: content cell — heading + description + CTA link.
 */
export default function parse(element, { document }) {
  const inner = element.querySelector('.container > div') || element;

  const image = inner.querySelector('figure img, img, picture');
  const heading = inner.querySelector('h1, h2, h3');
  const description = inner.querySelector('p');
  const cta = inner.querySelector('a[href]');
  // Fiix CTAs carry an sr-only "(opens in new tab)" span — strip it so the link
  // text stays clean (matches the other parsers' CTA handling).
  if (cta) cta.querySelectorAll('.sr-only').forEach((sr) => sr.remove());

  // Empty-block guard.
  if (!heading && !description && !cta) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: optional image (own 1-cell row).
  if (image) cells.push([image]);

  // Row 3: content cell holding heading + description + CTA (single cell).
  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (description) contentCell.push(description);
  if (cta) contentCell.push(cta);
  cells.push([contentCell]); // 1-column row: one cell holds all content.

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-cta', cells });
  element.replaceWith(block);
}
