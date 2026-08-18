/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (reuse existing blocks; new hero-case-study extractor).
import heroCaseStudyParser from './parsers/hero-case-study.js';
import columnsMediaParser from './parsers/columns-media.js';
import heroCtaParser from './parsers/hero-cta.js';

// TRANSFORMER IMPORTS - cleanup first, sections after (adds <hr> + metadata)
import cleanupTransformer from './transformers/fiix-cleanup.js';
import sectionsTransformer from './transformers/fiix-sections.js';

// PARSER REGISTRY - Map parser names to functions
const parsers = {
  'hero-case-study': heroCaseStudyParser,
  'columns-media': columnsMediaParser,
  'hero-cta': heroCtaParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json (case-study-page)
const PAGE_TEMPLATE = {
  name: 'case-study-page',
  description: 'Customer case study page: hero (customer name + headline), customer intro with logo/headshot/quote and challenge-solution-result columns, company overview narrative with embedded video, and a closing free-tour CTA band.',
  urls: [
    'https://fiixsoftware.com/resource-center/case-studies/universal-pure/',
    'https://fiixsoftware.com/resource-center/case-studies/dlg-group/',
    'https://fiixsoftware.com/resource-center/case-studies/farming-maintenance/',
    'https://fiixsoftware.com/resource-center/case-studies/edms-consultants/',
  ],
  // Selectors are keyed on the shared `div.case-studies-temp` wrapper rather than
  // a specific layout modifier: universal-pure/dlg-group use `.cloeren`, the older
  // farming-maintenance page uses `.jf`. `.ba-fiix` (challenge/solution/result
  // columns) is absent on farming-maintenance — that page's infographic + narrative
  // fall through to default content, which the empty-block guard handles cleanly.
  blocks: [
    { name: 'hero-case-study', instances: ['div.case-studies-temp > header'] },
    { name: 'columns-media', instances: ['div.company-intro div.ba-fiix', '.ba-fiix'] },
    { name: 'hero-cta', instances: ['div.kick-the-tires'] },
  ],
  // The closing "kick the tires" CTA is split into its own section carrying the
  // shared `cta` section style (soft cyan→white gradient + centered layout),
  // matching the pricing/premium/enterprise CTA bands. Everything above the CTA
  // stays in the first (unstyled) section. Two sections → the section transformer
  // emits one <hr> break before the CTA plus its Section Metadata block.
  sections: [
    { id: 'case-study-body', name: 'Case study body', selector: ['div.case-studies-temp > header'], style: null, blocks: ['hero-case-study', 'columns-media'], defaultContent: [] },
    { id: 'case-study-cta', name: 'Free tour CTA', selector: ['div.kick-the-tires', '.kick-the-tires'], style: 'cta', blocks: ['hero-cta'], defaultContent: [] },
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
      const parser = parsers[block.name];
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

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

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
