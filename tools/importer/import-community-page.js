/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (reuse existing blocks; community-specific extractors).
import communityHeroParser from './parsers/community-hero.js';
import communityWhyJoinParser from './parsers/community-why-join.js';
import communityTestimonialsParser from './parsers/community-testimonials.js';
import communityCtaParser from './parsers/community-cta.js';

// TRANSFORMER IMPORTS - cleanup first, sections after (adds <hr> + metadata)
import cleanupTransformer from './transformers/fiix-cleanup.js';
import sectionsTransformer from './transformers/fiix-sections.js';

// SELECTOR-AWARE PARSER RESOLUTION
function resolveParser(blockName, selector) {
  if (selector.includes('.intro')) return communityHeroParser;
  if (selector.includes('join-flex')) return communityWhyJoinParser;
  if (selector.includes('quotes')) return communityTestimonialsParser;
  if (selector.includes('get-started')) return communityCtaParser;
  return null;
}

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (community-page)
const PAGE_TEMPLATE = {
  name: 'community-page',
  description: 'The Fiixers community page reusing existing blocks.',
  urls: ['https://fiixsoftware.com/community/'],
  blocks: [
    { name: 'columns-media', instances: ['header:has(.intro)'] },
    { name: 'cards-icon', instances: ['.join-flex'] },
    { name: 'carousel-testimonial', instances: ['.quotes'] },
    { name: 'hero-cta', instances: ['.get-started'] },
  ],
  sections: [
    { id: 'community-hero', name: 'Hero', selector: ['header:has(.intro)'], style: 'community-hero', blocks: ['columns-media'], defaultContent: [] },
    { id: 'community-why', name: 'Why join', selector: ['section:has(.join-flex)'], style: 'community-why', blocks: ['cards-icon', 'carousel-testimonial'], defaultContent: ['section:has(.join-flex) > .container > h2'] },
    { id: 'community-cta', name: 'Get started CTA', selector: ['.get-started'], style: 'community-cta', blocks: ['hero-cta'], defaultContent: [] },
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
