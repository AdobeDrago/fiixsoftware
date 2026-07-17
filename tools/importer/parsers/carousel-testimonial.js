/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-testimonial. Base: carousel.
 * Source: https://fiixsoftware.com/
 * Instance: `.beingused`
 * Generated: 2026-07-15
 *
 * EDS Carousel convention: 2 columns, each ROW = one slide.
 *   Cell 1 = Image (mandatory), with no other content — the author headshot.
 *   Cell 2 = Text content (optional) — headline (h3), result + quote paragraphs,
 *            author name/role, and the company logo image.
 *
 * The block's decorate() marks the first column as the slide image and the rest
 * as slide content, so the headshot goes alone in cell 1 and everything else
 * (including the company logo) goes in cell 2.
 *
 * Source is an Owl Carousel: slides live in `.owl-item > .item`. Owl duplicates
 * real slides as `.owl-item.cloned` for infinite looping, so we EXCLUDE clones
 * and dedupe by headline text to emit each unique testimonial exactly once.
 */
export default function parse(element, { document }) {
  // Real slides only: skip Owl's cloned duplicates.
  const owlItems = Array.from(element.querySelectorAll('.owl-item:not(.cloned) > .item'));
  const items = owlItems.length
    ? owlItems
    : Array.from(element.querySelectorAll('.mh-slider .item, .item'));

  // Empty-block guard.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  const seen = new Set();

  items.forEach((item) => {
    // Dedupe by headline (cloned slides share identical content).
    const h3 = item.querySelector('h3');
    const key = (h3 ? h3.textContent : item.textContent).trim();
    if (!key || seen.has(key)) return;
    seen.add(key);

    // Cell 1: slide image — the author headshot only (no other content).
    const headshot = item.querySelector('.headshot img, .headshot picture');

    // Cell 2: content — headline + result/quote paragraphs + author name/role
    // + company logo image (preserved as <img> for upload).
    const contentCell = [];
    if (h3) contentCell.push(h3);
    // Top-level quote/result paragraphs (direct children of .item).
    Array.from(item.querySelectorAll(':scope > p')).forEach((p) => contentCell.push(p));
    // Author name + role paragraphs live beside the headshot in .person_feature > div.
    const authorInfo = item.querySelector('.person_feature > div');
    if (authorInfo) {
      Array.from(authorInfo.querySelectorAll('p')).forEach((p) => contentCell.push(p));
    }
    // Company logo goes with the content (cell 1 must be image-only).
    const companyLogo = item.querySelector('.company_logo img, .company_logo picture');
    if (companyLogo) contentCell.push(companyLogo);

    if (!headshot && contentCell.length === 0) return;
    cells.push([
      headshot || '',
      contentCell.length ? contentCell : '',
    ]); // 2-column: image | content.
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-testimonial', cells });
  element.replaceWith(block);
}
