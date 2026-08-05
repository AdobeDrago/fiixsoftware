/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (reuse existing blocks; contact-specific extractors).
import contactHeaderParser from './parsers/contact-header.js';
import contactConnectParser from './parsers/contact-connect.js';
import contactOfficeParser from './parsers/contact-office.js';

// TRANSFORMER IMPORTS - cleanup first, sections after (adds <hr> + metadata)
import cleanupTransformer from './transformers/fiix-cleanup.js';
import sectionsTransformer from './transformers/fiix-sections.js';

// SELECTOR-AWARE PARSER RESOLUTION
function resolveParser(blockName, selector) {
  if (selector.includes('contact-header')) return contactHeaderParser;
  if (selector.includes('contact-location')) return contactOfficeParser;
  if (selector.includes('page-container')) return contactConnectParser;
  return null;
}

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (contact-us-page)
const PAGE_TEMPLATE = {
  name: 'contact-us-page',
  description: 'Contact Us page reusing existing blocks.',
  urls: ['https://fiixsoftware.com/contact-us/'],
  blocks: [
    { name: 'columns-media', instances: ['.contact-header', '.contact-location'] },
    { name: 'cards-icon', instances: ['.page-container'] },
  ],
  sections: [
    { id: 'contact-hero', name: 'Get in touch hero', selector: ['.contact-header'], style: 'contact-hero', blocks: ['columns-media'], defaultContent: [] },
    { id: 'contact-connect', name: 'Connect cards', selector: ['.page-container'], style: 'contact-connect', blocks: ['cards-icon'], defaultContent: ['.page-container > h2'] },
    { id: 'contact-office', name: 'Office info + map', selector: ['.contact-location'], style: 'contact-office', blocks: ['columns-media'], defaultContent: [] },
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
