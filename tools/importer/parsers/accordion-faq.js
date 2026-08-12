/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base: accordion (cached convention: 2 columns —
 * Title cell + Content cell — one row per collapsible item).
 *
 * Shapes (branch on DOM so no page regresses):
 *   pricing / enterprise — the instance IS the `.faq-accordion` element; each
 *     direct child div (`.open`/`.closed`) is one FAQ item: <h3> question + <p>
 *     answer(s).
 *   marketing-landing (https://fiixsoftware.com/cmms/ai/ , /optix/) — the
 *     instance is the whole FAQ SECTION (`#RA-faq` / `section#RA-faq`) that
 *     wraps the accordion in `.industry_solutions_ .tab-faq .workorder-faq`.
 *     The section <h2> heading and a trailing "Learn more" CTA are default
 *     content, preserved as siblings; the accordion inside is extracted the
 *     same way. Optix answers are richer (H4 subheadings + multiple paragraphs
 *     + links) — the whole answer body goes in the content cell.
 * Generated: 2026-07-08 · Updated: 2026-08-11 (marketing-landing FAQ sections).
 *
 * Each row = [question (title), answer body (content)] — 2 columns.
 */
export default function parse(element, { document }) {
  const preserveBefore = (node) => { if (node && node.parentNode) element.parentNode.insertBefore(node, element); };

  // Locate the accordion. When the instance is a whole section, the accordion
  // is nested; when it IS the accordion, use it directly.
  const accordion = element.matches('.faq-accordion')
    ? element
    : element.querySelector('.faq-accordion');

  // Marketing sections: preserve the heading and trailing CTA as default content.
  if (accordion && accordion !== element) {
    const heading = element.querySelector(':scope > h2, :scope > h3, :scope > h1');
    if (heading) preserveBefore(heading);
    // Trailing CTA button (e.g. "Learn more about CBM with Fiix") sits outside
    // the accordion — keep it as default content.
    const ctaWrap = element.querySelector(':scope .industry_solutions_ > .text-center, :scope > .text-center');
    if (ctaWrap && !accordion.contains(ctaWrap)) preserveBefore(ctaWrap);
  }

  const root = accordion || element;
  // Each direct child div (open/closed) is one FAQ item.
  let items = Array.from(root.querySelectorAll(':scope > div'));
  // Fallback: some markup nests items one level deeper.
  if (items.length === 0) items = Array.from(root.querySelectorAll('.open, .closed'));

  // Empty-block guard.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  items.forEach((item) => {
    const title = item.querySelector('h1, h2, h3, h4');
    // Answer: everything in the item except the question heading — paragraphs,
    // H4 subheadings, lists and links, in document order (rich optix answers).
    const content = Array.from(item.children).filter((c) => c !== title);

    // Skip items with neither a title nor content.
    if (!title && content.length === 0) return;

    cells.push([
      title || '',
      content.length ? content : '',
    ]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
