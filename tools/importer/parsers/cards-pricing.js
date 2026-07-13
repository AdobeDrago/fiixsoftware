/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-pricing. Base: cards (no-images variant → 1 column per row).
 * Source: https://fiixsoftware.com/cmms/pricing/
 * Instance: `.pricing-plans-t .pricing-breakdown`
 * Generated: 2026-07-08
 *
 * Each `.pricing-performance` div is a plan card (Free, Basic, Professional,
 * Enterprise). No card images -> 1-column table, one row per card, all card
 * content in that single cell: plan name (h2), optional "Most popular" ribbon,
 * description, feature list, price group, and CTA link.
 */
export default function parse(element, { document }) {
  // Plan cards live in `.pricing-performance`. The instance element also
  // contains a `.headerbox` (H1 + intro + award logos) as a sibling of the
  // cards; that is authored as default content / the columns-logos block and
  // must survive. So we build the cards block from just the plan cards and
  // insert it in place of the FIRST card, then remove the remaining card
  // source nodes — rather than replacing the whole `.pricing-breakdown`
  // (which would destroy the headerbox).
  const cards = Array.from(element.querySelectorAll(':scope > .pricing-performance'));

  // Empty-block guard: leave the container (and its headerbox) untouched.
  if (cards.length === 0) {
    return;
  }

  const cells = [];

  cards.forEach((card) => {
    const cellContent = [];

    // Optional "Most popular" ribbon.
    const ribbon = card.querySelector(':scope > h4.ribbon');
    if (ribbon) cellContent.push(ribbon);

    // Plan name heading (mandatory).
    const heading = card.querySelector(':scope > h2');
    if (heading) cellContent.push(heading);

    // Plan description(s) — direct <p> children, excluding the mobile-only
    // "See top features" toggle (`.hide-d`).
    const descriptions = Array.from(card.querySelectorAll(':scope > p:not(.hide-d)'));
    descriptions.forEach((p) => cellContent.push(p));

    // Feature list group (may include "All X features +" line and the <ul>).
    const group = card.querySelector(':scope > .group');
    if (group) {
      // Strip decorative check icons so the list is clean text.
      group.querySelectorAll('i').forEach((icon) => icon.remove());
      cellContent.push(group);
    }

    // Price / footer group (large price, per-user note).
    const priceGroup = card.querySelector(':scope > .group-btm');
    if (priceGroup) cellContent.push(priceGroup);

    // CTA link (Sign up / Buy now / Book a demo). Remove sr-only text and icon.
    const cta = card.querySelector(':scope > a.buy, :scope > a.demo');
    if (cta) {
      cta.querySelectorAll('.sr-only, i').forEach((n) => n.remove());
      cellContent.push(cta);
    }

    cells.push([cellContent]); // 1-column row: one cell holding all card content.
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-pricing', cells });

  // Insert the block where the first plan card was, then remove all original
  // card nodes. This keeps the sibling `.headerbox` (H1, intro, award logos)
  // in place so it can be authored as default content / the logos block.
  const firstCard = cards[0];
  firstCard.parentNode.insertBefore(block, firstCard);
  cards.forEach((card) => card.remove());
}
