/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-callout. Base: columns.
 * Convention: Columns block — the second row defines the column count; here one
 * content row with 2 cells [text, CTA] → a two-column callout.
 *
 * Sources:
 *   https://fiixsoftware.com/cmms/pricing/ — `.lite_license` (`.lite-info` text
 *     + CTA button).
 *   product/feature pages (e.g. /cmms/cmms-software/) — `.section5r .cta-full`,
 *     a stats callout: an <h2> stat headline ("…6.2 million work orders…") + a
 *     "See how easy it is to get started" CTA link.
 * Generated: 2026-07-08 · Updated: 2026-08-11 (product-feature stats callout).
 *
 * Visually two columns: text info (heading + description + note) on one side,
 * CTA button on the other. One content row with 2 cells [text, CTA].
 */
export default function parse(element, { document }) {
  // CTA link (Contact us / "See how easy it is to get started").
  const cta = element.querySelector('a.demo, a.track, .lite-license > a, a[href]');

  // Text info: prefer the pricing `.lite-info` block; otherwise gather the
  // callout's own heading + descriptive paragraphs (excluding the CTA link),
  // e.g. the `.cta-full` stat headline on product-feature pages.
  let info = element.querySelector('.lite-info');
  if (!info) {
    const textCell = [];
    Array.from(element.querySelectorAll(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > p'))
      .forEach((node) => {
        if (cta && node.contains(cta)) return; // don't duplicate the CTA
        textCell.push(node);
      });
    info = textCell.length ? textCell : null;
  }

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
