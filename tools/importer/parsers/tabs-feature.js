/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-feature. Base: tabs (cached convention: 2 columns, each ROW =
 * one tab → cell 1 = tab label, cell 2 = tab content/media).
 *
 * Shapes (branch on DOM so no page regresses):
 *   home  https://fiixsoftware.com/ — `#feature-container` (feature switcher,
 *     videos) and `.parts-forecaster` (`#forecaster-desc` panels + image figure).
 *     Panels are `.feature-item .item` / `#forecaster-desc .item`; a sibling
 *     <figure> holds media that maps positionally to the panels.
 *   marketing-landing (https://fiixsoftware.com/cmms/ai/):
 *     `#homepage` — the Fiix Foresight 4-tab explorer wrapped in a section with a
 *       logo + H2 (default content). Panels live in the FIRST `.feature-item`;
 *       the panel <figure> holds 4 `.showvisual` screenshots (NOT the leading
 *       `figure.foresight-logo`). A mobile-accordion duplicate (`.industry_solutions_`)
 *       is discarded with the element. Logo + H2 are preserved as default content.
 *     `section.integrations-feature` — the Asset Insights 2-tab toggle. Tab
 *       labels come from `.feature-selector-twotoggle a`; each `.item.twotoggleN`
 *       panel carries its OWN screenshot (`.mobile-cont figure img`) and an `<ol>`
 *       of explanatory bullets. The section H2 is preserved as default content.
 * Generated: 2026-07-15 · Updated: 2026-08-11 (marketing-landing tab panels).
 *
 * Images preserved as <img> for upload; videos are external .mp4 sources
 * represented as links so the source URL survives.
 */
export default function parse(element, { document }) {
  const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const preserveBefore = (node) => { if (node && node.parentNode) element.parentNode.insertBefore(node, element); };
  const normalizeLazy = (root) => root.querySelectorAll('img').forEach((img) => {
    if (!img.getAttribute('src')) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      if (lazy) img.setAttribute('src', lazy);
    }
  });

  // ---------- marketing-landing: Asset Insights 2-tab toggle ----------
  // Tab labels live in a separate selector; each panel holds its own media + list.
  const twoToggleLabels = Array.from(element.querySelectorAll('.feature-selector-twotoggle a'));
  if (twoToggleLabels.length) {
    normalizeLazy(element);
    const heading = element.querySelector(':scope > .container > h2, :scope > h2');
    if (heading) preserveBefore(heading);
    const panelRoot = element.querySelector('.feature-item') || element;
    const panels = Array.from(panelRoot.querySelectorAll(':scope > .item'));
    const cells = [];
    panels.forEach((panel, i) => {
      // Label from the toggle selector (fallback to a positional label).
      const label = document.createElement('p');
      label.textContent = norm(twoToggleLabels[i] ? twoToggleLabels[i].textContent : `Tab ${i + 1}`);
      // Panel content: the screenshot + the explanatory bullet list.
      const panelCell = [];
      const media = panel.querySelector('.mobile-cont figure img, .mobile-cont figure picture, figure img, img');
      if (media) panelCell.push(media);
      const list = panel.querySelector('.mobile-cont > ol, .mobile-cont > ul, :scope ol, :scope ul');
      if (list) panelCell.push(list);
      // Any panel heading/description (rare here) — keep for completeness.
      panel.querySelectorAll(':scope > h2, :scope > h3, :scope > h4, :scope > p').forEach((p) => panelCell.push(p));
      cells.push([label, panelCell.length ? panelCell : '']);
    });
    if (cells.length === 0) { element.replaceWith(...element.childNodes); return; }
    const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-feature', cells });
    element.replaceWith(block);
    return;
  }

  // ---------- marketing-landing: Fiix Foresight explorer wrapped in #homepage ----------
  // Preserve the leading logo + H2 as default content; extract the desktop tab
  // panels and the panel screenshot figure (not the logo figure). The mobile
  // accordion duplicate is discarded when the element is replaced.
  if (element.id === 'homepage' || element.matches('#homepage')) {
    normalizeLazy(element);
    const inner = element.querySelector('#feature-container') || element;
    const container = inner.querySelector(':scope > .container') || inner;
    const logo = container.querySelector(':scope > figure.foresight-logo, :scope > figure');
    const h2 = container.querySelector(':scope > h2');
    [logo, h2].forEach(preserveBefore);

    const featureItem = element.querySelector('.feature-item');
    const items = featureItem ? Array.from(featureItem.querySelectorAll(':scope > .item')) : [];
    // Panel screenshots: the figure that is a SIBLING of .feature-item (holds the
    // positional `.showvisual` images), never the leading logo figure.
    let panelFig = featureItem ? featureItem.nextElementSibling : null;
    while (panelFig && panelFig.tagName !== 'FIGURE') panelFig = panelFig.nextElementSibling;
    if (!panelFig) panelFig = Array.from(element.querySelectorAll('figure')).find((f) => f.querySelector('img.showvisual, img'));
    const media = panelFig
      ? Array.from(panelFig.querySelectorAll(':scope > img, :scope > picture'))
      : [];

    if (items.length) {
      const cells = [];
      items.forEach((item, i) => {
        const h3 = item.querySelector('h3');
        let labelCell;
        if (h3) {
          const label = document.createElement('p');
          const link = h3.querySelector('a');
          label.textContent = norm(link ? link.textContent : h3.textContent);
          labelCell = label;
        } else {
          labelCell = `Tab ${i + 1}`;
        }
        const panelCell = [];
        Array.from(item.children).forEach((child) => { if (child !== h3) panelCell.push(child); });
        if (media[i]) panelCell.push(media[i]);
        cells.push([labelCell, panelCell.length ? panelCell : '']);
      });
      const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-feature', cells });
      element.replaceWith(block);
      return;
    }
    // no panels found → fall through to generic handling
  }

  // ---------- generic (home #feature-container / .parts-forecaster) ----------
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
