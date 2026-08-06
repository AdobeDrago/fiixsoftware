/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the training-and-implementation hero (columns-media). Base: columns.
 * Source: https://fiixsoftware.com/training-and-implementation/
 * Instance: `.training-implementation > header`
 * Generated: 2026-08-05
 *
 * `.training-implementation` is the single wrapper for all page sections; the
 * hero is its first child `<header>`. Two columns: a copy column (H1 + H2 +
 * "See all features" link) and a media column (workers photo). A decorative
 * circle graphic is dropped; the workers photo is kept as the media cell.
 */
export default function parse(element, { document }) {
  const textBlock = element.querySelector('.header-content, .intro, header > div > div') || element;

  const textCell = [];
  const h1 = element.querySelector('h1');
  const h2 = element.querySelector('h2');
  const link = element.querySelector('a[href]');
  if (h1) textCell.push(h1);
  if (h2) textCell.push(h2);
  if (link) {
    const p = document.createElement('p');
    p.append(link);
    textCell.push(p);
  }

  // Media column: the main photo (largest non-decorative image). The circle
  // graphic is decorative; pick the "workers" photo by alt, else the last img.
  const imgs = Array.from(element.querySelectorAll('img'));
  const photo = imgs.find((i) => /worker|tablet|team/i.test(i.getAttribute('alt') || '')) || imgs[imgs.length - 1] || null;

  if (textCell.length === 0 && !photo) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell.length ? textCell : '', photo || '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
