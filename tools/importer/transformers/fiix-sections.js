/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Fiix Software section breaks and section metadata.
 *
 * Template-agnostic: reads the section definitions from whatever template is
 * being imported (payload.template.sections) and, for each section:
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
 * `.pricing-topfeatures` → cards-features on pricing-page, or `.home_header`
 * → hero-lead on home-page), which a parser later replaces via replaceWith;
 * sibling placement keeps the break/metadata intact regardless.
 *
 * No per-template code is needed — the section list, selectors, and styles all
 * come from payload.template.sections, so both templates are handled by the
 * same logic:
 *   - pricing-page (8 styled sections)  → 7 <hr> + 8 Section Metadata
 *   - home-page    (8 styled sections;
 *       .home_header, .proof, #feature-container, .seehow, #security,
 *       .parts-forecaster, .beingused, .coming-to-fiix.bottom-cta-double —
 *       all verified in the home migration-work/cleaned.html)
 *                                       → 7 <hr> + 8 Section Metadata
 *   - product-feature-page (18 styled sections; styles pf-hero, pf-logos,
 *       pf-features, pf-video, pf-media-left, pf-media-right, pf-testimonials,
 *       pf-explore, pf-resources, pf-final-cta). No per-template code was added:
 *       the section list, selectors and styles all come from
 *       payload.template.sections, so this template is handled by the same
 *       template-agnostic logic. All 18 anchor selectors were verified to match
 *       a unique element in the product-feature-page migration-work/cleaned.html,
 *       in document order:
 *         .header (638), .fiix-users (1195), .section1 (1217),
 *         .video-demo (1256), .section2:not(.section2last) (1818),
 *         .section3:not(.section3last):not(.section3r) (1836),
 *         .social-proof-ratings (1865), .section4:not(.section4r) (1929),
 *         .section5:not(.section5r):not(.section5last) (1947),
 *         #analyze-audits (1973), .section3r (1991), .section4r (2018),
 *         .section5r (2033), .section2.section2last (2059),
 *         .section3.section3last (2077), .section6 (2099), .section7 (2284),
 *         .home-seemore (2322).
 *       The .header anchor is the first exact `.header` class token in the DOM
 *       and does NOT collide with header.siteHeader (tag header / class
 *       siteHeader) or #mobile-header (class mobile-header-v1), both of which the
 *       cleanup transformer removes anyway.
 *                                       → 17 <hr> + 18 Section Metadata
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
