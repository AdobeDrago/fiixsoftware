/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the community hero (columns-media). Base: columns.
 * Source: https://fiixsoftware.com/community/
 * Instance: the content `<header>` (NOT the site nav header.siteHeader)
 * Generated: 2026-08-06
 *
 * Two-column hero: a copy column (`.intro .summary` — Fiixers logo + H1 +
 * subhead + "Join now" CTA) and a media column (the community messaging-board
 * image). A decorative circle background (`.background_asset2`, aria-hidden) is
 * dropped. Emits [copy, board image].
 */
export default function parse(element, { document }) {
  const summary = element.querySelector('.summary, .intro > div') || element.querySelector('.intro');

  const textCell = [];
  if (summary) {
    Array.from(summary.children).forEach((child) => {
      if (child.textContent.trim() || child.querySelector('a, img')) textCell.push(child);
    });
  }

  // Media column: the messaging-board screenshot — the non-decorative image
  // that is NOT the Fiixers logo and NOT the aria-hidden background asset.
  const imgs = Array.from(element.querySelectorAll('img'));
  const board = imgs.find((i) => {
    const alt = (i.getAttribute('alt') || '').toLowerCase();
    const decorative = i.getAttribute('aria-hidden') === 'true' || i.getAttribute('role') === 'presentation';
    return !decorative && !/fiixers logo/.test(alt) && /board|messaging|community/.test(alt);
  }) || imgs.find((i) => i.getAttribute('aria-hidden') !== 'true' && !/fiixers logo/i.test(i.getAttribute('alt') || ''));

  if (textCell.length === 0 && !board) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell.length ? textCell : '', board || '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
