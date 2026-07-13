/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-features. Base: cards (no-images variant → 1 column per row).
 * Source: https://fiixsoftware.com/cmms/pricing/
 * Instance: `.pricing-topfeatures`
 * Generated: 2026-07-08
 *
 * Text-only feature blurbs inside `.feature-container`. Each card div holds an
 * <h3> heading + <p> description (no images). 1-column table, one row per card.
 * A `.flex-break` spacer div is skipped.
 */
export default function parse(element, { document }) {
  const container = element.querySelector('.feature-container') || element;

  // Feature cards are direct child divs that contain a heading; skip spacers.
  const cards = Array.from(container.querySelectorAll(':scope > div'))
    .filter((div) => div.querySelector('h1, h2, h3, h4, p'));

  // Empty-block guard.
  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  cards.forEach((card) => {
    const cellContent = [];
    const heading = card.querySelector('h1, h2, h3, h4');
    if (heading) cellContent.push(heading);
    const paragraphs = Array.from(card.querySelectorAll(':scope > p'));
    paragraphs.forEach((p) => cellContent.push(p));

    if (cellContent.length === 0) return;
    cells.push([cellContent]); // 1-column row: single cell holds heading + description.
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-features', cells });
  element.replaceWith(block);
}
