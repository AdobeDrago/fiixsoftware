/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-testimonial. Base: carousel.
 * Sources:
 *   https://fiixsoftware.com/ — `.beingused` (owl carousel w/ headshots)
 *   product/feature pages (e.g. /cmms/cmms-software/):
 *     • `.social-proof-ratings` — a 3-up grid of review cards (`.flex > div`),
 *       each with a star rating, a quote, and author name/role (no image).
 *     • `.section6 #cs-items` — the case-study slider (`.feature-item .item`),
 *       each slide with a company logo, a title, a quote, an author line, and a
 *       "read the case study" link.
 * Generated: 2026-07-15 · Updated: 2026-08-11 (product-feature testimonials).
 *
 * EDS Carousel convention: 2 columns, each ROW = one slide.
 *   Cell 1 = Image (mandatory when present), with no other content.
 *   Cell 2 = Text content — title (Heading), quote/description, author, CTA.
 * When a slide has no image (review cards) cell 1 is left empty, matching the
 * enterprise-hero testimonial variant; decorate() treats cell 1 as optional.
 */
export default function parse(element, { document }) {
  // ---- product-feature: `.social-proof-ratings` review-card grid ----
  const ratingGrid = element.querySelector(':scope > .container > .flex, .flex');
  const ratingCards = ratingGrid
    ? Array.from(ratingGrid.querySelectorAll(':scope > div')).filter((div) => div.querySelector('p'))
    : [];
  if (element.matches('.social-proof-ratings') && ratingCards.length) {
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
      cells.push(['', contentCell]); // cell 1 empty (no image), cell 2 = review.
    });
    if (cells.length === 0) { element.replaceWith(...element.childNodes); return; }
    const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-testimonial', cells });
    // Replace only the card grid so the section heading (default content) and
    // the trailing `.flex-link` case-studies CTA survive as section content.
    ratingGrid.replaceWith(block);
    return;
  }

  // ---- product-feature: `#cs-items` case-study slider ----
  const csItems = Array.from(element.querySelectorAll('.feature-item .item, #cs-items .item'));
  if ((element.matches('#cs-items') || element.querySelector('#cs-items, .feature-item')) && csItems.length) {
    const cells = [];
    const seen = new Set();
    csItems.forEach((item) => {
      const title = item.querySelector('p.title');
      const key = (title ? title.textContent : item.textContent).trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      // Cell 1: the company logo (figure.mobile img), image-only.
      const logo = item.querySelector('figure.mobile img, figure.mobile picture, figure img');
      // Cell 2: title + quote/author paragraphs + case-study link.
      const contentCell = [];
      Array.from(item.querySelectorAll(':scope > p')).forEach((p) => contentCell.push(p));
      if (!logo && contentCell.length === 0) return;
      cells.push([logo || '', contentCell.length ? contentCell : '']);
    });
    if (cells.length === 0) { element.replaceWith(...element.childNodes); return; }
    // Case-study variant: single-slide layout (logo on top, stacked title /
    // quote / author / CTA) rather than the default 3-up testimonial cards.
    const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-testimonial (case-study)', cells });
    element.replaceWith(block);
    return;
  }

  // ---- home `.beingused`: owl carousel with author headshots ----
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
