/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (reuse existing blocks; training-specific extractors).
import trainingHeroParser from './parsers/training-hero.js';
import trainingPackagesParser from './parsers/training-packages.js';
import trainingIconCardsParser from './parsers/training-icon-cards.js';
import trainingSupportListsParser from './parsers/training-support-lists.js';
import trainingCommunityParser from './parsers/training-community.js';
import premiumBenefitsTableParser from './parsers/premium-benefits-table.js';

// TRANSFORMER IMPORTS - cleanup first, sections after (adds <hr> + metadata)
import cleanupTransformer from './transformers/fiix-cleanup.js';
import sectionsTransformer from './transformers/fiix-sections.js';

// SELECTOR-AWARE PARSER RESOLUTION
function resolveParser(blockName, selector) {
  if (selector.includes('header')) return trainingHeroParser;
  if (selector.includes('cont-tia')) return trainingPackagesParser;
  if (selector.includes('cont.training') || selector.includes('.demand')) return trainingIconCardsParser;
  if (selector.includes('support-options')) return trainingSupportListsParser;
  if (selector.includes('scaling-success')) return trainingCommunityParser;
  if (selector.includes('no_mobile')) return premiumBenefitsTableParser;
  return null;
}

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (training-page)
const PAGE_TEMPLATE = {
  name: 'training-page',
  description: 'Training & Implementation page reusing existing blocks.',
  urls: ['https://fiixsoftware.com/training-and-implementation/'],
  blocks: [
    { name: 'columns-media', instances: ['.training-implementation > header', '.support-scaling .support-options', '.scaling-success'] },
    { name: 'cards-features', instances: ['.started .cont-tia'] },
    { name: 'cards-icon', instances: ['.started .cont.training', '.demand'] },
    { name: 'table-compare', instances: ['.support-scaling .no_mobile'] },
  ],
  sections: [
    { id: 'training-hero', name: 'Hero', selector: ['.training-implementation > header'], style: 'training-hero', blocks: ['columns-media'], defaultContent: [] },
    { id: 'training-services', name: 'Implementation services', selector: ['.started'], style: 'training-services', blocks: ['cards-features', 'cards-icon'], defaultContent: ['.started .eyebrow', '.started .h2heading'] },
    { id: 'training-support', name: 'Support', selector: ['.support-scaling'], style: 'training-support', blocks: ['columns-media', 'table-compare'], defaultContent: ['.support-scaling .flex-intro'] },
    { id: 'training-demand', name: 'On-demand training', selector: ['.demand'], style: 'training-demand', blocks: ['cards-icon'], defaultContent: ['.demand .eyebrow', '.demand .h2heading'] },
    { id: 'training-community', name: 'Fiixers community', selector: ['.scaling-success'], style: 'training-community', blocks: ['columns-media'], defaultContent: [] },
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
