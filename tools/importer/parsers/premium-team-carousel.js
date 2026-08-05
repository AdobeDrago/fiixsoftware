/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the "Meet Your A-Team" carousel (carousel-testimonial).
 * Source: https://fiixsoftware.com/premium-support/
 * Instance: `.support-team .mh-slider.slider1`
 * Generated: 2026-08-05
 *
 * Owl carousel of consultant cards. Each `.item` has a `.person_feature` with
 * a `.headshot` image + name/role paragraphs, and a `.quote` paragraph. The
 * carousel-testimonial block treats cell 1 as the slide image (headshot) and
 * cell 2 as content (name, role, quote). Owl clones are excluded and slides are
 * de-duplicated by name so each consultant renders once.
 */
export default function parse(element, { document }) {
  const owlItems = Array.from(element.querySelectorAll('.owl-item:not(.cloned) > .item'));
  const items = owlItems.length
    ? owlItems
    : Array.from(element.querySelectorAll(':scope .item, .item'));

  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  const seen = new Set();

  items.forEach((item) => {
    const headshot = item.querySelector('.headshot img, .headshot picture');
    const nameEl = item.querySelector('.person_feature strong, .person_feature p');
    const key = (nameEl ? nameEl.textContent : item.textContent).trim();
    if (!key || seen.has(key)) return;
    seen.add(key);

    // Cell 2 content: name + role paragraphs (from .person_feature > div) + quote.
    const contentCell = [];
    const info = item.querySelector('.person_feature > div');
    if (info) Array.from(info.querySelectorAll('p')).forEach((p) => contentCell.push(p));
    const quote = item.querySelector('.quote, p.quote');
    if (quote) contentCell.push(quote);

    if (!headshot && contentCell.length === 0) return;
    cells.push([headshot || '', contentCell.length ? contentCell : '']);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-testimonial', cells });
  element.replaceWith(block);
}
