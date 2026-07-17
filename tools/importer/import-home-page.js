/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroLeadParser from './parsers/hero-lead.js';
import columnsLogosParser from './parsers/columns-logos.js';
import tabsFeatureParser from './parsers/tabs-feature.js';
import cardsVideoParser from './parsers/cards-video.js';
import cardsIconParser from './parsers/cards-icon.js';
import carouselTestimonialParser from './parsers/carousel-testimonial.js';
import cardsCtaParser from './parsers/cards-cta.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/fiix-cleanup.js';
import sectionsTransformer from './transformers/fiix-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-lead': heroLeadParser,
  'columns-logos': columnsLogosParser,
  'tabs-feature': tabsFeatureParser,
  'cards-video': cardsVideoParser,
  'cards-icon': cardsIconParser,
  'carousel-testimonial': carouselTestimonialParser,
  'cards-cta': cardsCtaParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'home-page',
  description: 'Fiix home page: lead hero with email form + stats, customer logo strip, feature tabs, video cards, security icons, insights tabs, testimonial carousel, and dual CTA panels. Header and footer are shared fragments.',
  urls: [
    'https://fiixsoftware.com/',
  ],
  blocks: [
    { name: 'hero-lead', instances: ['.home_header'] },
    { name: 'columns-logos', instances: ['.proof'] },
    { name: 'tabs-feature', instances: ['#feature-container', '.parts-forecaster'] },
    { name: 'cards-video', instances: ['.seehow'] },
    { name: 'cards-icon', instances: ['#security'] },
    { name: 'carousel-testimonial', instances: ['.beingused'] },
    { name: 'cards-cta', instances: ['.coming-to-fiix.bottom-cta-double'] },
  ],
  sections: [
    { id: 'hero', name: 'Hero', selector: ['.home_header'], style: 'home-hero', blocks: ['hero-lead'], defaultContent: [] },
    { id: 'logo-strip', name: 'Customer logos', selector: ['.proof'], style: 'logos', blocks: ['columns-logos'], defaultContent: ['.proof h2'] },
    { id: 'feature-tabs', name: 'Feature tabs', selector: ['#feature-container'], style: 'feature-tabs', blocks: ['tabs-feature'], defaultContent: ['#feature-container h2'] },
    { id: 'video-cards', name: 'Video cards', selector: ['.seehow'], style: 'video-cards', blocks: ['cards-video'], defaultContent: ['.seehow h2'] },
    { id: 'security-icons', name: 'Security', selector: ['#security'], style: 'security', blocks: ['cards-icon'], defaultContent: ['#security h2', '#security > p'] },
    { id: 'insights-tabs', name: 'Insights tabs', selector: ['.parts-forecaster'], style: 'insights-tabs', blocks: ['tabs-feature'], defaultContent: ['.parts-forecaster h2', '.parts-forecaster > p'] },
    { id: 'testimonial-carousel', name: 'Testimonial carousel', selector: ['.beingused'], style: 'testimonials', blocks: ['carousel-testimonial'], defaultContent: ['.beingused h2'] },
    { id: 'dual-cta', name: 'Dual CTA', selector: ['.coming-to-fiix.bottom-cta-double'], style: 'dual-cta', blocks: ['cards-cta'], defaultContent: [] },
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

    // 6. Generate sanitized path. The home page is the site root ("/"), which
    // sanitizes to an empty string — that breaks the importer's in-browser path
    // resolution (an empty path triggers a process.cwd() call that doesn't
    // exist in the browser). Map the root to "/index" so the document is
    // authored under the index node.
    const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath || '/index');

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
