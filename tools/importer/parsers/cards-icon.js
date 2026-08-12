/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-icon. Base: cards (with icon → 2 columns per row; cached
 * library convention: image/icon cell mandatory + text cell with optional
 * Title heading, Description, and CTA).
 *
 * Shapes (branch on DOM so no page regresses):
 *   pricing  https://fiixsoftware.com/cmms/pricing/ — `.succeed-container`
 *     customer-success icons: each `<dl>` = <dt><img> icon + first <dd> title +
 *     remaining <dd> description.
 *   marketing-landing (https://fiixsoftware.com/cmms/ai/ , /optix/) — icon grids
 *     built from `.flex-item` / benefit `article` cells:
 *       section.philosophy > .RA-four-flex > .flex-item  (icon figure + <p>, no title)
 *       section.connect: an icon grid (connect targets) PLUS benefit cards
 *         (icon + H3 + description). The section <h2> and any note paragraph are
 *         default content, preserved as siblings; every icon/benefit cell becomes
 *         one card row so both seq-2 and seq-4 grids are captured in one block.
 * Generated: 2026-07-08 · Updated: 2026-08-11 (marketing-landing icon grids).
 *
 * 2-column table: cell 1 = icon image, cell 2 = optional title (Heading) + text.
 * Section headings/notes are default content (handled elsewhere) and excluded.
 */
export default function parse(element, { document }) {
  const normalizeLazy = (root) => root.querySelectorAll('img').forEach((img) => {
    if (!img.getAttribute('src')) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      if (lazy) img.setAttribute('src', lazy);
    }
  });
  const preserveBefore = (node) => { if (node && node.parentNode) element.parentNode.insertBefore(node, element); };

  // ---------- marketing-landing: `.flex-item` / benefit-card icon grids ----------
  // Matches AI philosophy (.RA-four-flex > .flex-item) and optix connect
  // (icon grid + benefit articles). Detect by the presence of these cells.
  const iconCells = Array.from(element.querySelectorAll(
    ':scope > .container > .RA-four-flex > .flex-item, :scope .RA-four-flex > .flex-item, :scope .flex-item, :scope .connect-grid > article, :scope .benefits > article, :scope .container > article',
  ));
  const isMarketing = element.matches('section.philosophy, section.connect') || iconCells.length > 0;
  if (isMarketing && iconCells.length > 0) {
    normalizeLazy(element);
    const container = element.querySelector(':scope > .container') || element;
    // Preserve default content: the section heading and any standalone note
    // paragraph / CTA that are NOT inside an icon/benefit cell nor a grid wrapper.
    Array.from(container.children).forEach((c) => {
      if (iconCells.includes(c)) return;
      const holdsCell = iconCells.some((cell) => c.contains(cell));
      if (holdsCell) return; // grid wrapper containing cells — leave it for extraction
      if (/^(H1|H2|H3|H4)$/.test(c.tagName) || c.tagName === 'P' || c.tagName === 'A') preserveBefore(c);
    });

    const cells = [];
    iconCells.forEach((cell) => {
      const icon = cell.querySelector('figure img, figure picture, img, picture');
      const textCell = [];
      // Optional title (benefit cards have an H3; philosophy items have none).
      const heading = cell.querySelector('h1, h2, h3, h4');
      if (heading) textCell.push(heading);
      Array.from(cell.querySelectorAll(':scope > p, :scope > div > p')).forEach((p) => textCell.push(p));
      const cta = cell.querySelector('a[href]');
      if (cta && !textCell.includes(cta)) { cta.querySelectorAll('.sr-only').forEach((s) => s.remove()); textCell.push(cta); }
      if (!icon && textCell.length === 0) return;
      cells.push([icon || '', textCell.length ? textCell : '']); // 2-col: icon | title+text
    });
    if (cells.length === 0) { element.replaceWith(...element.childNodes); return; }
    const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon', cells });
    element.replaceWith(block);
    return;
  }

  // ---------- generic/pricing: `<dl>` icon items ----------
  const items = Array.from(element.querySelectorAll('dl'));

  // Empty-block guard.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  items.forEach((dl) => {
    const icon = dl.querySelector('dt img, dt picture, img');
    const defs = Array.from(dl.querySelectorAll('dd'));

    const textCell = [];
    if (defs.length > 0) {
      // First <dd> is the title → promote to a heading for card styling.
      const title = document.createElement('h3');
      title.innerHTML = defs[0].innerHTML;
      textCell.push(title);
      // Remaining <dd> are description paragraphs.
      defs.slice(1).forEach((dd) => {
        const p = document.createElement('p');
        p.innerHTML = dd.innerHTML;
        textCell.push(p);
      });
    }

    if (!icon && textCell.length === 0) return;
    cells.push([icon || '', textCell.length ? textCell : '']); // 2-column: icon | text.
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon', cells });
  element.replaceWith(block);
}
