/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-cta. Base: cards (cached convention: 2-column Cards with a
 * mandatory image/icon + text cell; a 1-column "Cards (no images)" variant when
 * cards carry no image — text cell only with Title heading + Description + CTA).
 *
 * Shapes (branch on DOM so no page regresses):
 *   home  https://fiixsoftware.com/ — `.coming-to-fiix.bottom-cta-double`: two
 *     side-by-side CTA panels, each with a figure image + heading + copy + CTA.
 *   product/feature — `.pricing-breakdown > .pricing-performance` resource card
 *     trio: `p.product-icon` image + <span>(H3 + <p>) + "Uncover details" CTA.
 *   marketing-landing (https://fiixsoftware.com/cmms/ai/) —
 *     `section.dualCTA-box > .container > .CTAbox-flex > article`: two paired CTA
 *     articles (heading + paragraph + red button), NO image → the 1-column
 *     "no images" shape: one row per article, single text cell holding
 *     [heading, paragraph, CTA].
 * Generated: 2026-07-15 · Updated: 2026-08-11 (marketing-landing dual-CTA articles).
 */
export default function parse(element, { document }) {
  // ---------- marketing-landing: `.CTAbox-flex > article` paired CTAs ----------
  // Text-only panels → 1-column "no images" Cards: each article is one row whose
  // single cell holds the heading + paragraph + CTA link.
  const ctaBox = element.querySelector('.CTAbox-flex');
  const articles = ctaBox ? Array.from(ctaBox.querySelectorAll(':scope > article')) : [];
  if (element.matches('section.dualCTA-box') || articles.length) {
    const cells = [];
    articles.forEach((article) => {
      const body = [];
      Array.from(article.children).forEach((child) => {
        if (child.tagName === 'A') child.querySelectorAll('.sr-only').forEach((s) => s.remove());
        body.push(child);
      });
      if (body.length === 0) return;
      cells.push([body]); // 1-column row: single cell holds heading + copy + CTA.
    });
    if (cells.length === 0) { element.replaceWith(...element.childNodes); return; }
    // Article variation matches production `.CTAbox-flex > article` panels.
    const block = WebImporter.Blocks.createBlock(document, { name: 'cards-cta (article)', cells });
    element.replaceWith(block);
    return;
  }

  // ---- product-feature-page shape: `.pricing-breakdown` resource cards ----
  const breakdown = element.querySelector('.pricing-breakdown');
  const resourceCards = breakdown
    ? Array.from(breakdown.querySelectorAll(':scope > .pricing-performance'))
    : [];
  if (resourceCards.length) {
    const cells = [];
    resourceCards.forEach((card) => {
      const icon = card.querySelector('.product-icon img, .product-icon picture, figure img, img');
      const body = document.createElement('div');
      // Title + description usually live inside a wrapping <span>; flatten it.
      card.querySelectorAll(':scope > span > h1, :scope > span > h2, :scope > span > h3, :scope > span > h4, :scope > span > p, :scope > h2, :scope > h3, :scope > h4, :scope > p:not(.product-icon)')
        .forEach((node) => body.append(node));
      const cta = card.querySelector('a[href]');
      if (cta) {
        cta.querySelectorAll('.sr-only').forEach((sr) => sr.remove());
        body.append(cta);
      }
      if (!icon && body.childNodes.length === 0) return;
      cells.push([icon || '', body.childNodes.length ? body : '']);
    });
    if (cells.length === 0) return; // leave section untouched
    const block = WebImporter.Blocks.createBlock(document, { name: 'cards-cta', cells });
    // Replace only the card grid so the section heading (default content) stays.
    breakdown.replaceWith(block);
    return;
  }

  // ---- home shape: `.coming-to-fiix.bottom-cta-double` CTA panels ----
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
