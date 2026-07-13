/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Fiix Software section breaks and section metadata.
 *
 * Reads the section definitions from the pricing-page template
 * (payload.template.sections) and, for each section:
 *   - inserts a Section Metadata block carrying section.style, and
 *   - inserts an <hr> section break before every section except the first.
 *
 * Sections are processed in reverse document order so that inserting <hr> /
 * metadata for a later section does not shift the anchor elements of earlier
 * sections. Each section provides a fallback list of selectors (verified in
 * migration-work/cleaned.html); the first selector that matches an element
 * under `main` is used as the section anchor.
 *
 * Runs in beforeTransform (before block parsers consume section elements) and
 * inserts the <hr> break and Section Metadata block as SIBLINGS around the
 * anchor. Several section anchors ARE the block source element (e.g.
 * `.pricing-topfeatures` → cards-features), which a parser later replaces via
 * replaceWith; sibling placement keeps the break/metadata intact regardless.
 *
 * Expected output for the pricing-page template (8 sections, all styled):
 *   - 7 <hr> section breaks (one before each non-first section)
 *   - 8 Section Metadata blocks (one per styled section)
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Find the first element matching any selector in the section's selector list.
function findSectionAnchor(element, selectors) {
  if (!Array.isArray(selectors)) return null;
  for (const selector of selectors) {
    if (!selector) continue;
    const match = element.querySelector(selector);
    if (match) return match;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  // Run before block parsers so every section anchor still exists. Several
  // anchors ARE block source elements that parsers later replace, so break /
  // metadata are placed as siblings (before/after the anchor) to survive.
  if (hookName !== TransformHook.beforeTransform) return;

  const template = payload && payload.template;
  const sections = template && template.sections;
  if (!Array.isArray(sections) || sections.length < 2) return;

  const doc = element.ownerDocument;

  // Reverse order: insertions for later sections must not move earlier anchors.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    const anchor = findSectionAnchor(element, section.selector);
    if (!anchor) {
      // eslint-disable-next-line no-console
      console.warn('Section anchor not found for section:', section.id);
      continue;
    }

    // Section Metadata block: emitted for every section that declares a style.
    // Placed as a sibling AFTER the anchor (not appended inside it) so it is
    // not consumed when a parser replaces the anchor element.
    if (section.style) {
      const metadataBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      if (anchor.nextSibling) {
        anchor.parentNode.insertBefore(metadataBlock, anchor.nextSibling);
      } else {
        anchor.parentNode.appendChild(metadataBlock);
      }
    }

    // Section break before every section except the first.
    if (i > 0) {
      const hr = doc.createElement('hr');
      anchor.parentNode.insertBefore(hr, anchor);
    }
  }
}
