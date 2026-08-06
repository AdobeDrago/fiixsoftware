/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the training/implementation packages (cards-features). Base: cards.
 * Source: https://fiixsoftware.com/training-and-implementation/
 * Instance: `.started` (the packages live in `.plans-training` + `.cont-tia`)
 * Generated: 2026-08-05
 *
 * Text-only package cards. The "Training only" group (`.plans-training .tflex-box`)
 * and the "Training and implementation" group (`.cont-tia .ti-box`) each hold an
 * <h4> title (with a decorative icon), a description <p>, a "Perfect for:" label,
 * a <ul>, and a CTA link. Emits a 1-column cards-features row per card with the
 * heading + description + list + CTA (icons are stripped by the pipeline).
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.tflex-box, .ti-box'));

  if (cards.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cards.forEach((card) => {
    const cellContent = [];
    Array.from(card.children).forEach((child) => {
      const tag = child.tagName;
      // Keep headings, paragraphs, lists; convert the "Perfect for:" <span>
      // label to a paragraph so it survives as text.
      if (/^H[1-6]$/.test(tag) || tag === 'P' || tag === 'UL') {
        cellContent.push(child);
      } else if (tag === 'SPAN' && child.textContent.trim()) {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${child.textContent.trim()}</strong>`;
        cellContent.push(p);
      }
    });
    if (cellContent.length === 0) return;
    cells.push([cellContent]);
  });

  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-features', cells });
  element.replaceWith(block);
}
