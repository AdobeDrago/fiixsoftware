/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-timeline. Base: cards (NEW variant for this migration).
 * Source: https://fiixsoftware.com/cmms/ai/
 * Instance: `main > section.timeline`
 * Generated: 2026-08-11
 *
 * Horizontal connected "AI at Fiix" milestone timeline. Source shape:
 *   section.timeline > .container > h2 (default content) + ul > li*
 *   each li = <p.top-title><strong>Label</strong></p> + <div.event-date> (empty)
 *             + <p.pad>Year</p>
 *
 * Block contract (see blocks/cards-timeline/cards-timeline.js and the cached
 * library convention — base "Cards", with a 1-column "Cards (no images)"
 * variant when items carry no image):
 *   The decorator turns each authored ROW into one milestone <li>, then within
 *   the milestone body it scans the paragraphs: the short, mostly-numeric line
 *   (e.g. "2022") is tagged as the date and placed below the rail, the rest is
 *   the label placed above the rail. Label and year must therefore live in the
 *   SAME cell. The AI milestones have no icon, so each milestone is a single
 *   text cell → this renders as the 1-COLUMN "no images" shape: one row per
 *   milestone whose only cell holds [label paragraph, year paragraph].
 *   The block also supports an optional leading image cell (picture-only div →
 *   milestone image) for future authored timelines with icons; when an icon is
 *   present a row carries [image, body] like the base 2-column Cards.
 *
 * The section <h2> "AI at Fiix" is default content: it is moved out as a sibling
 * before the block so it survives (the block table replaces only the timeline).
 */
export default function parse(element, { document }) {
  // Milestones: prefer explicit list items; fall back to any repeated child.
  const list = element.querySelector('ul, ol');
  const items = list
    ? Array.from(list.querySelectorAll(':scope > li'))
    : Array.from(element.querySelectorAll(':scope > .container > ul > li, li'));

  // Preserve the section heading as default content (moved before the block).
  const heading = element.querySelector(':scope > .container > h2, :scope > h2, h2');
  if (heading && heading.parentNode) element.parentNode.insertBefore(heading, element);

  // Empty-block guard.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  items.forEach((li) => {
    // Optional milestone icon (none in the AI page, but supported by the block).
    const icon = li.querySelector('picture, img');

    // Label: the product-name paragraph(s). The bold `.top-title` line is the
    // label; any non-year paragraph counts. Year: the short numeric line (`.pad`
    // or a bare year like 2022/2026), matched the same way the decorator does.
    const paras = Array.from(li.querySelectorAll(':scope > p'));
    const isYear = (p) => {
      const t = p.textContent.trim();
      return t.length <= 12 && /\d/.test(t) && !p.querySelector('a');
    };
    let yearP = [...paras].reverse().find((p) => p.classList.contains('pad') && isYear(p))
      || [...paras].reverse().find(isYear)
      || null;
    const labelParas = paras.filter((p) => p !== yearP && p.textContent.trim() !== '');

    // Build the single milestone cell: label line(s) then the year line.
    const cell = [];
    labelParas.forEach((p) => cell.push(p));
    if (yearP) cell.push(yearP);

    if (!icon && cell.length === 0) return;

    if (icon) {
      // Two-cell row: leading image cell + milestone body cell (base Cards).
      cells.push([icon, cell.length ? cell : '']);
    } else {
      // One-cell row: the milestone body (label + year). 1-column "no images".
      cells.push([cell]);
    }
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-timeline', cells });
  element.replaceWith(block);
}
