/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-video. Base: cards.
 * Source: https://fiixsoftware.com/
 * Instance: `.seehow`
 * Generated: 2026-07-15
 *
 * EDS Cards convention: 2 columns, each card = one ROW.
 *   Cell 1 = image (mandatory) — thumbnail, preserved as <img> for upload.
 *   Cell 2 = text content (mandatory) — caption + "Watch now" call-to-action.
 *
 * The block's decorate() detects the image cell (single-child picture) vs the
 * body cell automatically.
 *
 * Source: `.seehow .item-cont > .item`, each with an <img> thumbnail, a caption
 * <p>, and a <p class="watch">Watch now</p>. The actual video is a Vidyard
 * lightbox embed (`.videohide`) — we ignore that hidden markup and surface the
 * caption + "Watch now" text as the card body.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.item-cont > .item, .item'));

  // Empty-block guard.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  items.forEach((item) => {
    // Thumbnail image = the item's own direct <img>/<picture> (NOT the hidden
    // vidyard lightbox images inside .videohide).
    const thumb = item.querySelector(':scope > img, :scope > picture')
      || item.querySelector('img, picture');

    // Body: caption paragraph(s) + the "Watch now" label, ignoring the hidden
    // vidyard embed markup.
    const bodyCell = [];
    Array.from(item.querySelectorAll(':scope > p')).forEach((p) => bodyCell.push(p));

    if (!thumb && bodyCell.length === 0) return;
    cells.push([thumb || '', bodyCell.length ? bodyCell : '']); // 2-column: image | body.
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-video', cells });
  element.replaceWith(block);
}
