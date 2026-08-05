/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-testimonial (enterprise hero variant). Base: carousel.
 * Source: https://fiixsoftware.com/enterprise/
 * Instance: `.ent-header .loop.owl-carousel`
 * Generated: 2026-08-05
 *
 * The enterprise hero testimonials have no headshot image — each slide is a
 * `.item` with a star `<span>` (rating), a quote `<p>`, and 1-2 author/date
 * `<p>` lines. The carousel block treats cell 1 as the (optional) slide image
 * and cell 2 as content, so we leave cell 1 empty and put the quote + author
 * lines in cell 2. Owl clones (`.owl-item.cloned`) are excluded and slides are
 * de-duplicated by quote text so each testimonial renders once.
 */
export default function parse(element, { document }) {
  const owlItems = Array.from(element.querySelectorAll('.owl-item:not(.cloned) > .item'));
  const items = owlItems.length
    ? owlItems
    : Array.from(element.querySelectorAll(':scope > .item, .item'));

  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  const seen = new Set();

  items.forEach((item) => {
    // Quote paragraph is the first <p> that isn't the author/date line.
    const paras = Array.from(item.querySelectorAll(':scope > p'));
    if (paras.length === 0) return;
    const key = paras[0].textContent.trim();
    if (!key || seen.has(key)) return;
    seen.add(key);

    // Cell 2 content: quote + author/date paragraphs (drop the star span).
    const contentCell = paras.map((p) => p);

    cells.push(['', contentCell]); // cell 1 empty (no headshot), cell 2 = content.
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-testimonial', cells });
  element.replaceWith(block);
}
