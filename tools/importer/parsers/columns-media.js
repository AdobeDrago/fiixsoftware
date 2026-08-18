/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-media. Base: columns.
 * Convention (cached library-description): Columns — the second row defines the
 * column count; here content rows with N cells → an N-column media + copy
 * layout. Each cell can hold an image or text (heading + copy + optional CTA).
 *
 * Sources / shapes (branch on DOM, so no page regresses):
 *   pricing  https://fiixsoftware.com/cmms/pricing/ — `.pricing-connectusers`
 *            (generic: one illustration + `.pricing-connectusers-content` copy).
 *   product/feature pages — `.intro-image` screenshot + `.intro-block` copy.
 *   marketing-landing (https://fiixsoftware.com/cmms/ai/ , /optix/) — sections
 *     that mix DEFAULT CONTENT (eyebrow / H2) with the block. The eyebrow and
 *     heading are preserved as siblings (moved before the block) so they import
 *     as default content, and the block carries only its media+copy columns:
 *       header.container       → split hero: `.header-info` copy+CTA | `figure.header-img`
 *       section.fiixMAX-info   → 3 `.question` rows, each [demo media | prompt+copy];
 *                                the logo, H2, hero video, trailing CTA and the
 *                                testimonial quote are preserved as default content.
 *       section.augury         → `.info-flex`: `.info-text` copy+CTA | `.info-img` graphic
 *       section.what-is-it     → copy column | benefit/stat list column (optix)
 *       section.case-study     → quote/author column | result-stat list column (optix)
 *       section.together       → two comparison columns (logo + copy each) (optix)
 * Generated: 2026-07-08 · Updated: 2026-08-11 (marketing-landing AI/optix shapes).
 *
 * Cells are emitted as [image|text, ...]; the alternating visual side is handled
 * by the section style, not by cell order. A hidden Marketo contact form modal
 * (`.white-popup.mfp-hide`) may be present and is excluded.
 */
export default function parse(element, { document }) {
  // Normalise lazy-loaded images so their URLs are captured for upload.
  const normalizeLazy = (root) => root.querySelectorAll('img').forEach((img) => {
    if (!img.getAttribute('src')) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      if (lazy) img.setAttribute('src', lazy);
    }
  });
  // Move a node out as a sibling BEFORE the block so it survives as default content.
  const preserveBefore = (node) => { if (node && node.parentNode) element.parentNode.insertBefore(node, element); };
  // Strip screen-reader-only noise from a CTA link but keep the link.
  const cleanLink = (a) => { if (a) a.querySelectorAll('.sr-only').forEach((s) => s.remove()); return a; };

  // ---------- case-study: challenge / solution / result columns (.ba-fiix) ----------
  // 3 sibling divs, each an h3 (with a decorative font-awesome <i>) + a bulleted
  // list. Text-only, no media. Each div becomes one column cell (heading + list).
  if (element.matches('.ba-fiix')) {
    const cols = Array.from(element.querySelectorAll(':scope > div'));
    const row = cols.map((col) => {
      col.querySelectorAll('i[class*="fa-"]').forEach((i) => i.remove()); // drop empty icon nodes
      col.querySelectorAll('.sr-only').forEach((s) => s.remove());
      const cell = [];
      const h = col.querySelector(':scope > h3, :scope > h2, :scope > h4');
      if (h) cell.push(h);
      col.querySelectorAll(':scope > .list-item > ul, :scope > .list-item > ol, :scope > ul, :scope > ol, :scope > p').forEach((n) => cell.push(n));
      return cell.length ? cell : '';
    }).filter((c) => c !== '');
    if (row.length === 0) { element.replaceWith(...element.childNodes); return; }
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
    element.replaceWith(block);
    return;
  }

  // ---------- marketing-landing: split hero (header.container) ----------
  // `.header-info` holds H1 + intro paragraphs + CTA; `figure.header-img` the art.
  const headerInfo = element.matches('header.container') || element.querySelector(':scope > .header-info')
    ? element.querySelector(':scope > .header-info') : null;
  if (headerInfo) {
    normalizeLazy(element);
    const artFig = element.querySelector(':scope > figure.header-img, :scope > figure');
    const art = artFig ? (artFig.querySelector('picture, img') || artFig) : null;
    const textCell = [];
    Array.from(headerInfo.children).forEach((c) => {
      if (c.tagName === 'A') cleanLink(c);
      textCell.push(c);
    });
    if (!art && textCell.length === 0) { element.replaceWith(...element.childNodes); return; }
    const cells = [[textCell.length ? textCell : '', art || '']]; // 2-col: copy | illustration
    const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
    element.replaceWith(block);
    return;
  }

  // ---------- marketing-landing: Fiix MAX product block (section.fiixMAX-info) ----------
  const questions = Array.from(element.querySelectorAll(':scope > .container > .question, :scope .question'));
  if (element.matches('section.fiixMAX-info') || questions.length) {
    normalizeLazy(element);
    const container = element.querySelector(':scope > .container') || element;
    // Default content preserved as siblings: leading logo figure, the H2, the
    // hero video block, the trailing CTA button, and the testimonial quote.
    const heading = container.querySelector(':scope > h2');
    const logoFig = container.querySelector(':scope > figure');
    const heroVid = container.querySelector(':scope > .vid-cont');
    const ctaWrap = container.querySelector(':scope > .text-center');
    const quote = container.querySelector(':scope > .quote');
    // Preserve in document order (insert each before the block).
    [logoFig, heading, heroVid, ctaWrap, quote].forEach(preserveBefore);

    const cells = [];
    questions.forEach((q) => {
      const qText = q.querySelector(':scope > .q-text') || q;
      const qVid = q.querySelector(':scope > .q-vid');
      // Demo media: an <img> thumbnail inside the vidyard embed (iframes are
      // stripped by cleanup; the image preserves the visual + its alt/prompt).
      let media = qVid ? (qVid.querySelector('img[class*="embed"], img') || qVid.querySelector('picture')) : null;
      const copyCell = [];
      Array.from(qText.children).forEach((c) => copyCell.push(c));
      if (!media && copyCell.length === 0) return;
      cells.push([media || '', copyCell.length ? copyCell : '']); // 2-col: demo media | prompt+copy
    });
    if (cells.length === 0) { element.replaceWith(...element.childNodes); return; }
    const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
    element.replaceWith(block);
    return;
  }

  // ---------- marketing-landing: 2-col info-flex (augury / optix) ----------
  // section.augury, and optix what-is-it / case-study / together: an eyebrow
  // and/or H2 is default content; the two content columns live in a flex wrapper.
  const flex = element.querySelector(
    ':scope > .container > .info-flex, :scope > .container > .flex, :scope > .info-flex, :scope > .flex, :scope > .container > .two-col, :scope > .together-flex',
  );
  const isMarketing2Col = element.matches('section.augury, section.what-is-it, section.case-study, section.together') || flex;
  if (isMarketing2Col && flex) {
    normalizeLazy(element);
    const container = element.querySelector(':scope > .container') || element;
    // Preserve eyebrow + heading (default content) that sit before the columns.
    Array.from(container.children).forEach((c) => {
      if (c === flex) return;
      if (/^(H1|H2|H3)$/.test(c.tagName) || (c.tagName === 'P' && !c.querySelector('img'))) preserveBefore(c);
    });
    // Two (or more) columns are the flex's element children with real content.
    const cols = Array.from(flex.children).filter(
      (c) => c.nodeType === 1 && (c.textContent.trim().length > 0 || c.querySelector('img')),
    );
    const row = cols.map((col) => {
      // Clean CTA sr-only noise inside the column.
      col.querySelectorAll('a .sr-only').forEach((s) => s.remove());
      const onlyImg = col.querySelector('picture, img');
      const hasText = col.textContent.trim().length > 0;
      if (onlyImg && !hasText) return onlyImg; // image-only column → pass the image
      return col; // mixed column (copy + heading + CTA, or a list) → pass the wrapper
    });
    if (row.length === 0) { element.replaceWith(...element.childNodes); return; }
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
    element.replaceWith(block);
    return;
  }

  // ---- product-feature-page shape: `.intro-image` + `.intro-block` ----
  const introImage = element.querySelector(':scope > .intro-image, .intro-image');
  const introBlock = element.querySelector(':scope > .container > .intro-block, .intro-block');
  if (introImage || introBlock) {
    // Real screenshot lives in figure.screen / figure.screen2; figure.shape /
    // figure.shape2 hold decorative 3D shapes we skip. Fall back to any image.
    let mediaImg = null;
    if (introImage) {
      mediaImg = introImage.querySelector('figure.screen img, figure.screen2 img, figure.screen picture, figure.screen2 picture')
        || Array.from(introImage.querySelectorAll('img')).find((im) => {
          const fig = im.closest('figure');
          return !fig || !/\bshape\b|\bshape2\b/.test(fig.className);
        })
        || introImage.querySelector('img, picture');
    }
    if (mediaImg && mediaImg.tagName !== 'IMG') mediaImg = mediaImg.querySelector('img') || mediaImg;
    if (mediaImg && mediaImg.tagName === 'IMG' && !mediaImg.getAttribute('src')) {
      const lazy = mediaImg.getAttribute('data-src') || mediaImg.getAttribute('data-lazy-src');
      if (lazy) mediaImg.setAttribute('src', lazy);
    }

    const textCell = [];
    if (introBlock) {
      Array.from(introBlock.children).forEach((child) => textCell.push(child));
    }

    if (!mediaImg && textCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }

    const pfCells = [[mediaImg || '', textCell.length ? textCell : '']];
    const pfBlock = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells: pfCells });
    element.replaceWith(pfBlock);
    return;
  }

  // ---- generic shape (pricing `.pricing-connectusers`, and others) ----
  // Image column (single illustration). The image lives outside the
  // `.pricing-connectusers-content` text block and outside the hidden popup.
  // Search broadly but exclude the Marketo modal, and normalise lazy-loaded
  // sources (data-src) so the URL is captured.
  const popup = element.querySelector('.white-popup, .mfp-hide');
  let image = Array.from(element.querySelectorAll('img, picture'))
    .find((el) => !popup || !popup.contains(el)) || null;

  if (image) {
    const img = image.tagName === 'IMG' ? image : image.querySelector('img');
    if (img && !img.getAttribute('src')) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      if (lazy) img.setAttribute('src', lazy);
    }
  }

  // Text column: heading + description + CTA.
  const content = element.querySelector('.pricing-connectusers-content');

  const cellContent = [];
  if (content) {
    // Preserve heading, paragraphs, and CTA link as-is.
    Array.from(content.children).forEach((child) => cellContent.push(child));
  }

  // Empty-block guard.
  if (!image && cellContent.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([image || '', cellContent.length ? cellContent : '']); // 2-column: image | text.

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
