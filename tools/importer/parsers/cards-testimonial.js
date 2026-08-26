/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-testimonial. Base: cards (no images).
 * Source: product/feature pages (e.g. /cmms/cmms-software/)
 *   • `.social-proof-ratings` — a 3-up grid of review cards (`.flex > div`),
 *     each with a star rating, a short quote, and author name/role (no image).
 * Generated: 2026-08-17.
 *
 * EDS "cards (no images)" convention: 1 column, one ROW per card. The single
 * cell holds the star rating ("N out of 5 stars" text), the quote paragraph,
 * and the author name + role paragraphs. The block JS renders these as a
 * static 3-up grid.
 */
export default function parse(element, { document }) {
  const ratingGrid = element.querySelector(':scope > .container > .flex, .flex');
  const ratingCards = ratingGrid
    ? Array.from(ratingGrid.querySelectorAll(':scope > div')).filter((div) => div.querySelector('p'))
    : [];

  if (ratingCards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  const seen = new Set();
  ratingCards.forEach((card) => {
    const paras = Array.from(card.querySelectorAll(':scope > p'));
    if (paras.length === 0) return;
    const key = paras[0].textContent.trim();
    if (!key || seen.has(key)) return;
    seen.add(key);

    const contentCell = [];
    // Preserve the star rating as accessible text ("5 out of 5 stars").
    const ratingText = card.querySelector('.sr-only');
    if (ratingText && ratingText.textContent.trim()) {
      const rp = document.createElement('p');
      rp.textContent = ratingText.textContent.trim();
      contentCell.push(rp);
    }
    paras.forEach((p) => contentCell.push(p));
    // Single-column "cards (no images)": one cell per row.
    cells.push([contentCell]);
  });

  if (cells.length === 0) { element.replaceWith(...element.childNodes); return; }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-testimonial', cells });
  // Replace only the card grid so the section heading (default content) and
  // the trailing `.flex-link` case-studies CTA survive as section content.
  ratingGrid.replaceWith(block);
}
