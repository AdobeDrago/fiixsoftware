/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsLogosParser from './parsers/columns-logos.js';
import cardsPricingParser from './parsers/cards-pricing.js';
import columnsCalloutParser from './parsers/columns-callout.js';
import tableCompareParser from './parsers/table-compare.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import cardsFeaturesParser from './parsers/cards-features.js';
import columnsMediaParser from './parsers/columns-media.js';
import cardsIconParser from './parsers/cards-icon.js';
import heroCtaParser from './parsers/hero-cta.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/fiix-cleanup.js';
import sectionsTransformer from './transformers/fiix-sections.js';

// PARSER REGISTRY
const parsers = {
  'columns-logos': columnsLogosParser,
  'cards-pricing': cardsPricingParser,
  'columns-callout': columnsCalloutParser,
  'table-compare': tableCompareParser,
  'accordion-faq': accordionFaqParser,
  'cards-features': cardsFeaturesParser,
  'columns-media': columnsMediaParser,
  'cards-icon': cardsIconParser,
  'hero-cta': heroCtaParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'pricing-page',
  description: 'CMMS plans and pricing page with header/navigation, pricing plans, feature comparison table, FAQ accordion, additional content sections, and footer',
  urls: [
    'https://fiixsoftware.com/cmms/pricing/',
  ],
  blocks: [
    { name: 'columns-logos', instances: ['.pricing_header .awards', '.fiix-users'] },
    { name: 'cards-pricing', instances: ['.pricing-plans-t .pricing-breakdown'] },
    { name: 'columns-callout', instances: ['.lite_license'] },
    { name: 'table-compare', instances: ['#compare .feature-table-t'] },
    { name: 'accordion-faq', instances: ['.faq-accordion'] },
    { name: 'cards-features', instances: ['.pricing-topfeatures'] },
    { name: 'columns-media', instances: ['.pricing-connectusers'] },
    { name: 'cards-icon', instances: ['.succeed-container'] },
    { name: 'hero-cta', instances: ['.pricing-kickthetires'] },
  ],
  sections: [
    { id: 'pricing-header', name: 'Pricing header', selector: ['#pricing'], style: 'pricing-hero', blocks: ['columns-logos', 'cards-pricing', 'columns-callout'], defaultContent: ['.pricing_header .headerbox'] },
    { id: 'compare', name: 'Feature comparison', selector: ['#compare'], style: 'feature-compare', blocks: ['table-compare'], defaultContent: [] },
    { id: 'customer-logos', name: 'Customer logos', selector: ['#page-wrap .new-product .fiix-users', '.fiix-users'], style: 'logos', blocks: ['columns-logos'], defaultContent: ['.fiixUserTeams-sect h2'] },
    { id: 'faq', name: 'FAQ', selector: ['#page-wrap .pricing-faq', '.pricing-faq'], style: 'faq', blocks: ['accordion-faq'], defaultContent: ['.pricing-faq .container > h2', '.pricing-faq .more-info'] },
    { id: 'top-features', name: 'Top features', selector: ['#page-wrap .pricing-topfeatures', '.pricing-topfeatures'], style: 'features', blocks: ['cards-features'], defaultContent: [] },
    { id: 'connect-users', name: 'Connect users', selector: ['#page-wrap .pricing-connectusers', '.pricing-connectusers'], style: 'connect-users', blocks: ['columns-media'], defaultContent: [] },
    { id: 'customer-success', name: 'Customer success', selector: ['#page-wrap .succeed-container', '.succeed-container'], style: 'customer-success', blocks: ['cards-icon'], defaultContent: ['.succeed-container > h2'] },
    { id: 'find-plan-cta', name: 'Find the plan CTA', selector: ['#page-wrap .pricing-kickthetires', '.pricing-kickthetires'], style: 'cta', blocks: ['hero-cta'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY - cleanup runs first, sections after (adds <hr> + section metadata)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
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

/**
 * Find all blocks on the page based on the embedded template configuration
 */
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
        if (seen.has(element)) return; // avoid double-processing across overlapping selectors
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced by a prior parser
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
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
