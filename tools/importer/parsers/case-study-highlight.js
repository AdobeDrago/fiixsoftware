/* eslint-disable */
/* global WebImporter */

/**
 * Parser for case-study-highlight.
 *
 * FactoryTalk Optix source structure:
 * - `.what-text`: blockquote + `.author` (portrait and attribution)
 * - `.stats li`: a signed outcome, with the number in `<strong>`
 *
 * EDS rows:
 * - quote | author image | author details
 * - minus/plus | metric | metric description
 */
export default function parse(element, { document }) {
  const normalizeLazy = (root) => root.querySelectorAll('img').forEach((img) => {
    if (!img.getAttribute('src')) {
      const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      if (lazy) img.setAttribute('src', lazy);
    }
  });

  normalizeLazy(element);

  const quote = element.querySelector('.what-text blockquote, blockquote');
  const author = element.querySelector('.what-text .author, .author');
  const image = author?.querySelector('picture, img') || null;
  const details = author?.querySelector('p') || null;
  const stats = [...element.querySelectorAll('.stats li')];

  if (!quote && stats.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[quote || '', image || '', details || '']];

  stats.forEach((stat) => {
    const metric = stat.querySelector('strong');
    const label = document.createElement('p');
    [...stat.childNodes].forEach((node) => {
      if (node !== metric) label.append(node);
    });
    const direction = stat.classList.contains('minus') ? 'minus' : 'plus';
    cells.push([direction, metric || '', label.textContent.trim() ? label : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'case-study-highlight',
    cells,
  });
  element.replaceWith(block);
}
