/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the premium-support hero (columns-media). Base: columns.
 * Source: https://fiixsoftware.com/premium-support/
 * Instance: `.premium-support > header` (the top banner)
 * Generated: 2026-08-05
 *
 * `.premium-support` is the single wrapper for ALL page sections; the hero is
 * its first child `<header>`. Two columns: a copy column (`.intro > div` — H1
 * eyebrow + H2 subhead + body paragraphs + email CTA) and a media column (a
 * Vidyard video with a poster image). The live Vidyard embed is not authorable,
 * so the media cell keeps the poster <img> if one is present.
 */
export default function parse(element, { document }) {
  const intro = element.querySelector('.intro > div') || element.querySelector('.intro');

  const textCell = [];
  if (intro) {
    Array.from(intro.children).forEach((child) => {
      if (child.textContent.trim() || child.querySelector('a, img')) textCell.push(child);
    });
  }

  // Media column: the video poster image (the <iframe>/<script> embed is dropped).
  const poster = element.querySelector('img');

  if (textCell.length === 0 && !poster) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell.length ? textCell : '', poster || '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
