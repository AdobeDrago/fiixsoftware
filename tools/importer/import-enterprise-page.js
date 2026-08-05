/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (reuse existing blocks; enterprise-specific extractors where
// the source DOM differs from the pricing/home pages).
import columnsLogosParser from './parsers/columns-logos.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import cardsIconParser from './parsers/cards-icon.js';
import heroCtaParser from './parsers/hero-cta.js';
import entCarouselParser from './parsers/enterprise-carousel-testimonial.js';
import entCardsIconParser from './parsers/enterprise-cards-icon.js';
import entColumnsMediaParser from './parsers/enterprise-columns-media.js';
import entSocialProofParser from './parsers/enterprise-social-proof.js';

// TRANSFORMER IMPORTS - cleanup runs first, sections after (adds <hr> + metadata)
import cleanupTransformer from './transformers/fiix-cleanup.js';
import sectionsTransformer from './transformers/fiix-sections.js';

// SELECTOR-AWARE PARSER RESOLUTION
// Most blocks have one parser; a few need a different extractor depending on
// which source selector matched (e.g. cards-icon product cards vs security
// badges; columns-media generic rows vs the social-proof feature selector).
function resolveParser(blockName, selector) {
  if (blockName === 'carousel-testimonial') return entCarouselParser;
  if (blockName === 'cards-icon') {
    return selector.includes('.ent-flex') ? entCardsIconParser : cardsIconParser;
  }
  if (blockName === 'columns-media') {
    return selector.includes('feature-container-ent') ? entSocialProofParser : entColumnsMediaParser;
  }
  if (blockName === 'columns-logos') return columnsLogosParser;
  if (blockName === 'accordion-faq') return accordionFaqParser;
  if (blockName === 'hero-cta') return heroCtaParser;
  return null;
}

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (enterprise-page)
const PAGE_TEMPLATE = {
  name: 'enterprise-page',
  description: 'Enterprise landing page reusing existing blocks.',
  urls: ['https://fiixsoftware.com/enterprise/'],
  blocks: [
    { name: 'columns-logos', instances: ['.ent-header .ent-logos', '.tools .tools-logos'] },
    { name: 'carousel-testimonial', instances: ['.ent-header .loop.owl-carousel'] },
    { name: 'cards-icon', instances: ['.tools .ent-flex', '.scale .secure-logos'] },
    { name: 'columns-media', instances: ['.scale .organized', '.social-proof #feature-container-ent', '.operation .product-flex', '.success .success-flex'] },
    { name: 'accordion-faq', instances: ['.scale .faq-accordion'] },
    { name: 'hero-cta', instances: ['.demo'] },
  ],
  sections: [
    { id: 'enterprise-hero', name: 'Hero', selector: ['.ent-header'], style: 'enterprise-hero', blocks: ['columns-logos', 'carousel-testimonial'], defaultContent: ['.ent-header h1', '.ent-header .container > h2:first-of-type', '.ent-header .container > p'] },
    { id: 'enterprise-tools', name: 'Tools & product cards', selector: ['.tools'], style: 'enterprise-tools', blocks: ['columns-logos', 'cards-icon'], defaultContent: ['.tools .tools-logos-header', '.tools > .container > h2'] },
    { id: 'enterprise-scale', name: 'Scale faster', selector: ['.scale'], style: 'enterprise-scale', blocks: ['columns-media', 'accordion-faq', 'cards-icon'], defaultContent: ['.scale > .container > h2', '.scale .maintenance-teams > h2', '.scale .fiix-secure'] },
    { id: 'enterprise-social-proof', name: 'Social proof', selector: ['.social-proof'], style: 'enterprise-social-proof', blocks: ['columns-media'], defaultContent: ['.social-proof #feature-container-ent > .container > h2'] },
    { id: 'enterprise-operation', name: 'World-class operation', selector: ['.operation'], style: 'enterprise-operation', blocks: ['columns-media'], defaultContent: ['.operation > .container > h2'] },
    { id: 'enterprise-success', name: 'Partner for success', selector: ['.success'], style: 'enterprise-success', blocks: ['columns-media'], defaultContent: [] },
    { id: 'enterprise-cta', name: 'Closing CTA', selector: ['.demo'], style: 'cta', blocks: ['hero-cta'], defaultContent: [] },
  ],
};

// TRANSFORMER REGISTRY
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

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced by a prior parser
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
