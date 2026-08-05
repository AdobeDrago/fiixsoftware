/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (reuse existing blocks; premium-support-specific extractors).
import premiumHeroParser from './parsers/premium-hero.js';
import premiumBenefitsCardsParser from './parsers/premium-benefits-cards.js';
import premiumCompareListsParser from './parsers/premium-compare-lists.js';
import premiumTeamCarouselParser from './parsers/premium-team-carousel.js';
import premiumSuccessParser from './parsers/premium-success.js';
import premiumCtaParser from './parsers/premium-cta.js';
import premiumBenefitsTableParser from './parsers/premium-benefits-table.js';

// TRANSFORMER IMPORTS - cleanup first, sections after (adds <hr> + metadata)
import cleanupTransformer from './transformers/fiix-cleanup.js';
import sectionsTransformer from './transformers/fiix-sections.js';

// SELECTOR-AWARE PARSER RESOLUTION
function resolveParser(blockName, selector) {
  // Order matters: the benefits-table selector contains the substring
  // "support-flex" (inside ":not(.support-flex)"), so match it FIRST.
  if (selector.includes(':not(.support-flex)')) return premiumBenefitsTableParser;
  if (selector.includes('header')) return premiumHeroParser;
  if (selector.includes('support-flex')) return premiumCompareListsParser;
  if (selector.includes('get-started')) return premiumSuccessParser;
  if (selector.includes('.started')) return premiumBenefitsCardsParser;
  if (selector.includes('mh-slider')) return premiumTeamCarouselParser;
  if (selector.includes('contact-sales')) return premiumCtaParser;
  return null;
}

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (premium-support-page)
const PAGE_TEMPLATE = {
  name: 'premium-support-page',
  description: 'Premium Support page reusing existing blocks.',
  urls: ['https://fiixsoftware.com/premium-support/'],
  blocks: [
    { name: 'columns-media', instances: ['.premium-support > header', '.support-scaling.support-flex', '.get-started'] },
    { name: 'cards-icon', instances: ['.started'] },
    { name: 'carousel-testimonial', instances: ['.support-team .mh-slider'] },
    { name: 'hero-cta', instances: ['.contact-sales'] },
    { name: 'table-compare', instances: ['.support-scaling:not(.support-flex)'] },
  ],
  sections: [
    { id: 'premium-hero', name: 'Hero', selector: ['.page-section'], style: 'premium-hero', blocks: ['columns-media'], defaultContent: [] },
    { id: 'premium-benefits', name: 'Benefit cards', selector: ['.started'], style: 'premium-benefits', blocks: ['cards-icon'], defaultContent: ['.started > .container > h2'] },
    { id: 'premium-compare', name: 'Premium vs Standard', selector: ['.support-scaling.support-flex'], style: 'premium-compare', blocks: ['columns-media'], defaultContent: ['.support-scaling.support-flex h2'] },
    { id: 'premium-team', name: 'Meet the team', selector: ['.support-team'], style: 'premium-team', blocks: ['carousel-testimonial'], defaultContent: ['.support-team > .container'] },
    { id: 'premium-success', name: 'Success story', selector: ['.get-started'], style: 'premium-success', blocks: ['columns-media'], defaultContent: [] },
    { id: 'premium-cta', name: 'Contact CTA', selector: ['.contact-sales'], style: 'cta', blocks: ['hero-cta'], defaultContent: [] },
    { id: 'premium-table', name: 'Exclusive benefits table', selector: ['.support-scaling:not(.support-flex)'], style: 'premium-table', blocks: ['table-compare'], defaultContent: ['.support-scaling:not(.support-flex) h2'] },
  ],
};

const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = resolveParser(block.name, block.selector);
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name} (${block.selector})`);
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
