/* eslint-disable */
/* global WebImporter */
/**
 * Parser for training icon-card grids (cards-icon). Base: cards.
 * Source: https://fiixsoftware.com/training-and-implementation/
 * Instances:
 *   `.started .cont.training` — remote-training benefits (image icons)
 *   `.demand .on-demand`       — on-demand resources (font-awesome <i> icons,
 *                                stripped by the pipeline → text-only cards)
 * Generated: 2026-08-05
 *
 * Each direct child div holds an optional icon (figure/img), a heading (h3/h4),
 * a description <p>, and (on-demand) a CTA link. 2-column table: cell 1 = icon
 * image (empty when only an <i> glyph existed), cell 2 = heading + copy + CTA.
 */
export default function parse(element, { document }) {
  const grid = element.querySelector('.cont.training, .on-demand') || element;
  const cards = Array.from(grid.querySelectorAll(':scope > div'));

  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cards.forEach((card) => {
    const icon = card.querySelector('figure img, figure picture, img');
    const textCell = [];
    const heading = card.querySelector('h1, h2, h3, h4');
    if (heading) textCell.push(heading);
    Array.from(card.querySelectorAll(':scope > p')).forEach((p) => textCell.push(p));
    const cta = card.querySelector('a[href]');
    if (cta) textCell.push(cta);
    if (!icon && textCell.length === 0) return;
    cells.push([icon || '', textCell.length ? textCell : '']);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon', cells });
  element.replaceWith(block);
}
