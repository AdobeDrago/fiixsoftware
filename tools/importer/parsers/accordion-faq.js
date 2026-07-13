/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base: accordion.
 * Source: https://fiixsoftware.com/cmms/pricing/
 * Instance: `.faq-accordion`
 * Generated: 2026-07-08
 *
 * 2-column accordion. Each FAQ item is a `.open`/`.closed` div containing an
 * <h3> question and a <p> answer (links preserved). One row per item:
 * cell 1 = question (title), cell 2 = answer (content).
 */
export default function parse(element, { document }) {
  // Each direct child div (open/closed) is one FAQ item.
  const items = Array.from(element.querySelectorAll(':scope > div'));

  // Empty-block guard.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  items.forEach((item) => {
    const title = item.querySelector('h3, h2, h4');
    // Answer: any content after the heading (paragraphs, keep links intact).
    const content = Array.from(item.querySelectorAll(':scope > p'));

    // Skip items with neither a title nor content.
    if (!title && content.length === 0) return;

    cells.push([
      title || '',
      content.length ? content : '',
    ]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
