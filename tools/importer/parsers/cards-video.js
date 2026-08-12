/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-video. Base: cards.
 * Sources: https://fiixsoftware.com/ (`.seehow`) and the product/feature pages
 *          (`.video-demo`, e.g. /cmms/cmms-software/).
 * Generated: 2026-07-15 · Updated: 2026-08-11 (product-feature `.video-demo`).
 *
 * EDS Cards convention: 2 columns, each card = one ROW.
 *   Cell 1 = image (mandatory) — thumbnail, preserved as <img> for upload.
 *   Cell 2 = text content (mandatory) — caption + "Watch now" call-to-action.
 *
 * The block's decorate() detects the image cell (single-child picture) vs the
 * body cell automatically.
 *
 * Each demo tile (`.item`) has an <img> thumbnail, a caption <p>, and a
 * <p class="watch">Watch now</p>. The actual video is a Vidyard lightbox embed
 * (`.videohide`) — we ignore that hidden markup and surface the caption +
 * "Watch now" text as the card body. One tile may instead be a "Watch more
 * demos" link (no thumbnail); it is kept with an empty image cell.
 *
 * `.video-demo` is an Owl Carousel that duplicates real slides as
 * `.owl-item.cloned` for infinite looping, so we prefer the non-cloned slides
 * and dedupe by caption to emit each tile exactly once.
 */
export default function parse(element, { document }) {
  // Prefer real (non-cloned) Owl slides; fall back to the flat `.seehow` shape.
  const owlItems = Array.from(element.querySelectorAll('.owl-item:not(.cloned) > .item'));
  const items = owlItems.length
    ? owlItems
    : Array.from(element.querySelectorAll('.item-cont > .item, .item'));

  // Empty-block guard.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  const seen = new Set();

  items.forEach((item) => {
    // Thumbnail image = the item's own direct <img>/<picture> (NOT the hidden
    // vidyard lightbox images inside .videohide).
    const thumb = item.querySelector(':scope > img, :scope > picture')
      || item.querySelector('img:not(.vidyard-lightbox-image), picture');

    // Body: caption paragraph(s) + the "Watch now" label (or a "Watch more
    // demos" link tile), ignoring the hidden vidyard embed markup.
    const bodyCell = [];
    Array.from(item.querySelectorAll(':scope > p')).forEach((p) => bodyCell.push(p));
    const moreLink = item.querySelector(':scope > a[href]');
    if (moreLink) bodyCell.push(moreLink);

    if (!thumb && bodyCell.length === 0) return;

    // Dedupe by caption/link text (defends against any clone leakage).
    const key = (bodyCell.map((n) => n.textContent).join(' ')
      || (thumb && thumb.getAttribute('src')) || '').replace(/\s+/g, ' ').trim();
    if (key && seen.has(key)) return;
    if (key) seen.add(key);

    cells.push([thumb || '', bodyCell.length ? bodyCell : '']); // 2-column: image | body.
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-video', cells });
  element.replaceWith(block);
}
