/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-lead. Base: hero (1-column block).
 * Sources: https://fiixsoftware.com/ (`.home_header`) and the
 *          product/feature pages (`.header`, e.g. /cmms/cmms-software/).
 * Generated: 2026-07-15 · Updated: 2026-08-11 (product-feature-page `.header`).
 *
 * EDS Hero convention: 1 column, 3 rows.
 *   Row 1: block name (added by createBlock).
 *   Row 2: single cell — Background/product Image (optional).
 *   Row 3: single cell — eyebrow/Title (h1), Subheading (h2), intro copy,
 *          lead-capture form, demo CTA link, and the review-star support line
 *          (`.sp-hero`: 5-star rating + "900+ reviews" + review-award logos).
 *
 * Two DOM shapes are handled:
 *   • home `.home_header`: `.header-flex` copy, `figure.hero-feature-image`
 *     product art, `section.using-fiix` stat metrics.
 *   • product-feature `.header`: `#homepage` copy, `figure.header-static`
 *     product screenshot, `.sp-hero` review/award strip.
 * The large hidden Marketo form (`.mktoForm`) duplicates the visible capture
 * form and is deliberately ignored; only the visible `#freetour_email` /
 * `.twoStep-form` form plus the demo anchor are kept.
 */
export default function parse(element, { document }) {
  // Prefer the inner headline/copy container when present (home vs product page).
  const copyRoot = element.querySelector('.header-flex, #homepage') || element;

  // Headline + subheading (fall back to the whole element if not under copyRoot).
  const h1 = copyRoot.querySelector('h1') || element.querySelector('h1');
  const h2 = copyRoot.querySelector('h2') || element.querySelector('h2');

  // Intro copy: the lead paragraph directly under the copy container
  // ("Stop wasting time with spreadsheets…"). Excludes review/stats captions.
  const introP = element.querySelector('#homepage > p, .header-flex > p, .header-copy > p');

  // Visible lead-capture email form (NOT the hidden Marketo form).
  const emailForm = element.querySelector('#freetour_email, .twoStep-form form, .twoStep-form');

  // Standalone CTA link (the "Request a demo" anchor) — the desktop CTA is a
  // value-less <input>, so the anchor is the only real link.
  const ctaLink = element.querySelector('a.mobile-cta[href], a.darkBlue-cta[href], a.track[href]');

  // Review-star support line ("Based on 900+ reviews on" + review-award logos).
  const reviewLine = element.querySelector('.sp-hero');

  // Intro line above the stats ("The average maintenance team using Fiix:").
  const statsIntro = element.querySelector('p.average');

  // Stat metrics block (the three .cont metric rows live in section.using-fiix).
  const statsSection = element.querySelector('section.using-fiix');

  // Hero product image (preserved as <img> so the importer uploads it). Prefer
  // the product-page static screenshot, then the home-page feature image.
  const heroImage = element.querySelector(
    'figure.header-static img, figure.header-static picture, .header-static img, '
    + 'figure.hero-feature-image img, figure.hero-feature-image picture, .hero-feature-image img',
  );

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
  if (introP) contentCell.push(introP);
  if (emailForm) contentCell.push(emailForm);
  if (ctaLink) contentCell.push(ctaLink);
  if (reviewLine) contentCell.push(reviewLine);
  if (statsIntro) contentCell.push(statsIntro);
  if (statsSection) contentCell.push(statsSection);
  cells.push([contentCell]); // 1-column row: one cell holds all content.

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-lead', cells });
  element.replaceWith(block);
}
