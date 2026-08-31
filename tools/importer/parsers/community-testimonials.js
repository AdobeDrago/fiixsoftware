/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the community testimonials (carousel-testimonial).
 * Source: https://fiixsoftware.com/community/
 * Instance: `.quotes`
 * Generated: 2026-08-06
 *
 * Three static review cards in `.quotes > .item`, each with a quote <p> and a
 * `.review-flex` (headshot <figure><img> + name/role <p>). The carousel block
 * treats cell 1 as the slide image (headshot) and cell 2 as content (quote +
 * name/role). Emits one row per review.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll(':scope > .item, .item'));

  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  const seen = new Set();

  items.forEach((item) => {
    const quote = item.querySelector(':scope > p');
    const key = (quote ? quote.textContent : item.textContent).trim();
    if (!key || seen.has(key)) return;
    seen.add(key);

    const headshot = item.querySelector('.review-flex figure img, .review-flex img, figure img');

    const contentCell = [];
    if (quote) contentCell.push(quote);
    // Name/role paragraph inside .review-flex.
    const author = item.querySelector('.review-flex p');
    if (author) contentCell.push(author);

    if (!headshot && contentCell.length === 0) return;
    cells.push([headshot || '', contentCell.length ? contentCell : '']);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-testimonial', cells });
  element.replaceWith(block);
}
