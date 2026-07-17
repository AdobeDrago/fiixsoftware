/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-cta. Base: cards (2 columns; each card = one row).
 * Source: https://fiixsoftware.com/
 * Instance: `.coming-to-fiix.bottom-cta-double`
 * Generated: 2026-07-15
 *
 * Two side-by-side CTA panels. Each panel = one row with 2 cells:
 *   cell 1: decorative figure image (mandatory image cell per cards convention)
 *   cell 2: heading + supporting paragraph(s) + CTA link
 * All content is extracted structurally from the panel DOM; nothing hardcoded.
 */
export default function parse(element, { document }) {
  const flex = element.querySelector('.ai-flex') || element.querySelector('.container') || element;
  const panels = [...flex.children].filter((c) => c.querySelector('h3, h2, a[href]'));

  // Empty-block guard.
  if (panels.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  panels.forEach((panel) => {
    const figureImg = panel.querySelector('figure img, figure picture, img');

    // Body: heading, paragraphs, and the CTA link.
    const body = document.createElement('div');
    panel.querySelectorAll(':scope > h2, :scope > h3, :scope > h4, :scope > p, :scope > a[href]').forEach((node) => {
      body.append(node);
    });
    // Some CTAs carry an sr-only span; keep the link text clean.
    body.querySelectorAll('a .sr-only').forEach((sr) => sr.remove());

    cells.push([figureImg || '', body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-cta', cells });
  element.replaceWith(block);
}
