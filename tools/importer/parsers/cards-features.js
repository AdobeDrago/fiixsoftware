/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-features. Base: cards → "Cards (no images)" variant.
 * Convention: 1 column, one row per card; the single cell holds an optional
 * Heading, an optional Description, and an optional Call-to-Action link.
 *
 * Sources:
 *   https://fiixsoftware.com/training-and-implementation/ — `.started .cont-tia`
 *   https://fiixsoftware.com/cmms/pricing/ — `.pricing-topfeatures`
 *     (`.feature-container > div` cards)
 *   product/feature pages (e.g. /cmms/cmms-software/) — `.section1`, `.section3*`,
 *     `.section5*` feature-blurb grids (`.product-flex .flex-group > div[id^=icon]`).
 * Generated: 2026-07-08 · Updated: 2026-08-11 (product-feature-page grids).
 *
 * Text-only feature blurbs: each card holds a heading + <p> copy (icons are CSS,
 * not authorable images), so the no-images (1-column) variant is correct.
 *
 * The product-feature pages nest cards two levels deep inside `.product-flex`
 * and mix them with section-level content (an `.intro-block` heading+lead, a
 * trailing `.flex-link` CTA, and — in `.section5r` — a `.cta-full` callout that
 * a LATER block parses). For that shape this parser replaces ONLY the card-grid
 * container so all sibling content survives for its own handler. The flat
 * training/pricing shape keeps its original whole-element behaviour unchanged.
 */
export default function parse(element, { document }) {
  const productFlex = element.querySelector('.product-flex');

  if (productFlex) {
    // ---- product-feature-page shape: nested grid, mixed sibling content ----
    // Real cards are the id="iconN" divs inside each `.flex-group`. Anything
    // else in the section (intro-block, flex-link CTA, cta-full callout) is left
    // in place for its own transformer/parser.
    const cards = Array.from(productFlex.querySelectorAll('.flex-group > div'))
      .filter((div) => div.querySelector('h1, h2, h3, h4'));

    if (cards.length === 0) return; // nothing to render; leave section untouched

    const cells = [];
    cards.forEach((card) => {
      const cellContent = [];
      const heading = card.querySelector('h1, h2, h3, h4');
      if (heading) cellContent.push(heading);
      Array.from(card.querySelectorAll(':scope > p')).forEach((p) => cellContent.push(p));
      const cardCta = card.querySelector(':scope > a[href]');
      if (cardCta) cellContent.push(cardCta);
      if (cellContent.length === 0) return;
      cells.push([cellContent]); // 1-column row: single cell holds heading + copy + CTA.
    });

    if (cells.length === 0) return;

    // A trailing `.flex-link` CTA heading sometimes lives INSIDE `.product-flex`
    // (e.g. `.section3`). Lift it out so it survives the replaceWith below and
    // stays as authored section content after the cards block.
    const strayLinks = Array.from(productFlex.querySelectorAll('.flex-link'));

    const block = WebImporter.Blocks.createBlock(document, { name: 'cards-features', cells });
    // Replace only the grid container so section-level content survives.
    productFlex.replaceWith(block);
    // Re-insert any lifted CTA(s) directly after the cards block.
    strayLinks.forEach((link) => {
      if (block.nextSibling) block.parentNode.insertBefore(link, block.nextSibling);
      else block.parentNode.appendChild(link);
    });
    return;
  }

  // ---- flat shape (training `.cont-tia`, pricing `.feature-container`) ----
  const container = element.querySelector('.feature-container') || element;

  // Feature cards are direct child divs that contain a heading or copy; skip spacers.
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
