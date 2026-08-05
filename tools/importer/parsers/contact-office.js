/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the contact-us office + map (columns-media). Base: columns.
 * Source: https://fiixsoftware.com/contact-us/
 * Instance: `.contact-location`
 * Generated: 2026-08-05
 *
 * Two-column band: office info (.contact-info — "Fiix" heading, phone,
 * address, and social links) and an interactive Google Map. The live map is a
 * JS widget that can't be migrated, so cell 2 becomes a static map link to
 * Google Maps for the Toronto office (a Maps Static-style placeholder link),
 * keeping the section a faithful 2-column layout.
 */
export default function parse(element, { document }) {
  const info = element.querySelector('.contact-info');

  const textCell = [];
  if (info) {
    Array.from(info.children).forEach((child) => {
      // Preserve heading, phone/address paragraphs, and the social list.
      if (child.textContent.trim() || child.querySelector('a')) textCell.push(child);
    });
  }

  // Map column: link out to the office location on Google Maps (the live embed
  // is not authorable). Coordinates from the source "Open in Google Maps" link.
  const mapWrap = document.createElement('div');
  const mapLink = document.createElement('a');
  mapLink.href = 'https://maps.google.com/maps?ll=43.639089,-79.419892&z=14';
  mapLink.textContent = 'View 40 Hanna Avenue, Toronto on Google Maps';
  mapWrap.append(mapLink);

  if (textCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[textCell, mapWrap]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
