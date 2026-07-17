/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-feature. Base: tabs.
 * Source: https://fiixsoftware.com/
 * Instances:
 *   `#feature-container`  — 5-tab feature switcher (panels: title, headline,
 *                           description, CTA, social-proof note; media = video).
 *   `.parts-forecaster`   — 4-tab insights switcher (panels: title, headline,
 *                           description, CTA; media = screenshot image).
 * Generated: 2026-07-15
 *
 * EDS Tabs convention: 2 columns, each ROW = one tab.
 *   Cell 1 = tab label (mandatory). The block's decorate() promotes
 *            `child.firstElementChild` to the tab button, so cell 1 holds a
 *            single label element.
 *   Cell 2 = tab content (mandatory) — the panel body + media.
 *
 * Both instances share structure: a list of `.item` panels (`.feature-item .item`
 * or `#forecaster-desc .item`) plus a sibling `<figure>` whose media children map
 * positionally to the panels. We pair the Nth panel with the Nth figure child.
 * Images are preserved as <img> for upload; videos are external .mp4 sources and
 * are represented as links so the source URL survives.
 */
export default function parse(element, { document }) {
  // The panels list. Feature switcher uses `.feature-item`, insights uses
  // `#forecaster-desc`; both contain `.item` panels.
  const panelsRoot = element.querySelector('.feature-item, #forecaster-desc')
    || element.querySelector('section, #forecaster');
  const items = panelsRoot
    ? Array.from(panelsRoot.querySelectorAll(':scope > .item'))
    : Array.from(element.querySelectorAll('.item'));

  // Positional media: direct children of the panel figure (videos or images).
  const figure = element.querySelector('figure');
  const media = figure
    ? Array.from(figure.querySelectorAll(':scope > video, :scope > img, :scope > picture'))
    : [];

  // Empty-block guard.
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  items.forEach((item, i) => {
    // Tab label = the item's <h3> (contains the tab title, possibly wrapping a link).
    const h3 = item.querySelector('h3');
    let labelCell;
    if (h3) {
      // Reduce to plain label text for a clean tab button (strip sr-only/icon noise).
      const label = document.createElement('p');
      const link = h3.querySelector('a');
      label.textContent = (link ? link.textContent : h3.textContent).trim().replace(/\s+/g, ' ');
      labelCell = label;
    } else {
      labelCell = `Tab ${i + 1}`;
    }

    // Panel content cell: everything from the item (headline, description, CTA,
    // notes) plus the positionally matched media element.
    const panelCell = [];

    // Preserve the item's non-label content nodes (h4, p, links, notes).
    Array.from(item.children).forEach((child) => {
      if (child === h3) return; // h3 is used as the tab label above.
      panelCell.push(child);
    });

    // Add the matching media element for this tab, if present.
    const mediaEl = media[i];
    if (mediaEl) {
      if (mediaEl.tagName === 'VIDEO') {
        // External .mp4 — represent as a link so the source URL is preserved.
        const src = mediaEl.querySelector('source');
        const url = src ? src.getAttribute('src') : mediaEl.getAttribute('src');
        if (url) {
          const a = document.createElement('a');
          a.href = url;
          a.textContent = url;
          panelCell.push(a);
        }
      } else {
        // <img>/<picture> — keep the element so the importer uploads it.
        panelCell.push(mediaEl);
      }
    }

    cells.push([labelCell, panelCell.length ? panelCell : '']); // 2-column row: label | panel.
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-feature', cells });
  element.replaceWith(block);
}
