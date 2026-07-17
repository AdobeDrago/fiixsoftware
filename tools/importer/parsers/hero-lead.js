/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-lead. Base: hero (1-column block).
 * Source: https://fiixsoftware.com/
 * Instance: `.home_header`
 * Generated: 2026-07-15
 *
 * EDS Hero convention: 1 column, 3 rows.
 *   Row 1: block name (added by createBlock).
 *   Row 2: single cell — Background Image (optional).
 *   Row 3: single cell — Title, Subheading, CTA (+ this variant's lead-capture
 *          form and stat metrics as additional authored content).
 *
 * The `.home_header` DOM contains a large hidden Marketo form (`.mktoForm`)
 * that duplicates the capture form. We deliberately ignore it and keep only
 * the visible lead-capture form (`#freetour_email` / `#userInput`) plus the
 * mobile CTA link. Site-nav markup is not part of `.home_header`.
 */
export default function parse(element, { document }) {
  // Prefer the inner headline/copy container when present.
  const headerFlex = element.querySelector('.header-flex') || element;

  // Headline + subheading.
  const h1 = headerFlex.querySelector('h1');
  const h2 = headerFlex.querySelector('h2');

  // Visible lead-capture email form (NOT the hidden Marketo form).
  const emailForm = element.querySelector('#freetour_email, .twoStep-form form, .twoStep-form');

  // Standalone CTA link (mobile "Request a demo") — the desktop CTA is a
  // value-less <input>, so the anchor is the only real link.
  const ctaLink = element.querySelector('a.mobile-cta[href], a.darkBlue-cta[href], a.track[href]');

  // Intro line above the stats ("The average maintenance team using Fiix:").
  const statsIntro = element.querySelector('p.average');

  // Stat metrics block (the three .cont metric rows live in section.using-fiix).
  const statsSection = element.querySelector('section.using-fiix');

  // Hero product image (preserved as <img> so the importer uploads it).
  const heroImage = element.querySelector('figure.hero-feature-image img, figure.hero-feature-image picture, .hero-feature-image img');

  // Empty-block guard.
  if (!h1 && !h2 && !heroImage) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background/hero image cell (optional).
  if (heroImage) cells.push([heroImage]);

  // Row 3: content cell — all textual hero content in one cell (1-column).
  const contentCell = [];
  if (h1) contentCell.push(h1);
  if (h2) contentCell.push(h2);
  if (emailForm) contentCell.push(emailForm);
  if (ctaLink) contentCell.push(ctaLink);
  if (statsIntro) contentCell.push(statsIntro);
  if (statsSection) contentCell.push(statsSection);
  cells.push([contentCell]); // 1-column row: one cell holds all content.

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-lead', cells });
  element.replaceWith(block);
}
