/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import accordionFaqParser from './parsers/accordion-faq.js';
import cardsCtaParser from './parsers/cards-cta.js';
import cardsIconParser from './parsers/cards-icon.js';
import cardsTimelineParser from './parsers/cards-timeline.js';
import columnsMediaParser from './parsers/columns-media.js';
import heroCtaParser from './parsers/hero-cta.js';
import tabsFeatureParser from './parsers/tabs-feature.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/fiix-cleanup.js';
import sectionsTransformer from './transformers/fiix-sections.js';

// PARSER REGISTRY
const parsers = {
  'accordion-faq': accordionFaqParser,
  'cards-cta': cardsCtaParser,
  'cards-icon': cardsIconParser,
  'cards-timeline': cardsTimelineParser,
  'columns-media': columnsMediaParser,
  'hero-cta': heroCtaParser,
  'tabs-feature': tabsFeatureParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "marketing-landing-page",
  "description": "Newer Fiix marketing landing page using a <main> landmark: split hero (copy + illustration), icon/stat grids, product feature blocks with alternating imagery, tabbed panels, benefit cards, two-column comparison, long FAQ accordion, and paired CTA articles.",
  "urls": [
    "https://fiixsoftware.com/cmms/ai/",
    "https://fiixsoftware.com/optix/"
  ],
  "blocks": [
    {
      "name": "columns-media",
      "instances": [
        "main > header.container",
        "main > section.fiixMAX-info",
        "main > section.augury",
        "main > section.what-is-it",
        "main > section.case-study",
        "main > section.together"
      ]
    },
    {
      "name": "cards-timeline",
      "instances": [
        "main > section.timeline"
      ]
    },
    {
      "name": "cards-icon",
      "instances": [
        "main > section.philosophy",
        "main > section.connect"
      ]
    },
    {
      "name": "accordion-faq",
      "instances": [
        "#RA-faq",
        "main > section#RA-faq"
      ]
    },
    {
      "name": "tabs-feature",
      "instances": [
        "#homepage",
        "main > section.integrations-feature"
      ]
    },
    {
      "name": "cards-cta",
      "instances": [
        "main > section.dualCTA-box"
      ]
    },
    {
      "name": "hero-cta",
      "instances": [
        "main > section.container .get-started, main > section.get-started"
      ]
    }
  ],
  "sections": [
    {
      "id": "ai-hero",
      "name": "Hero (Balanced Approach to AI)",
      "selector": [
        "main > header.container"
      ],
      "style": "ai-hero",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "ai-timeline",
      "name": "AI at Fiix timeline",
      "selector": [
        "main > section.timeline"
      ],
      "style": "ai-timeline",
      "blocks": [
        "cards-timeline"
      ],
      "defaultContent": [
        "main > section.timeline > h2"
      ]
    },
    {
      "id": "ai-fiixmax",
      "name": "Fiix MAX product block",
      "selector": [
        "main > section.fiixMAX-info"
      ],
      "style": "ai-fiixmax",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "ai-philosophy",
      "name": "AI Philosophy icon grid",
      "selector": [
        "main > section.philosophy"
      ],
      "style": "ai-philosophy",
      "blocks": [
        "cards-icon"
      ],
      "defaultContent": [
        "main > section.philosophy > h2"
      ]
    },
    {
      "id": "ai-augury",
      "name": "Fiix Asset Health / Augury",
      "selector": [
        "main > section.augury"
      ],
      "style": "ai-augury",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "ai-cbm-faq",
      "name": "Predictive Maintenance vs CBM Q&A",
      "selector": [
        "#RA-faq",
        "main > section#RA-faq"
      ],
      "style": "ai-faq",
      "blocks": [
        "accordion-faq"
      ],
      "defaultContent": []
    },
    {
      "id": "ai-foresight-tabs",
      "name": "Fiix Foresight tabbed panel",
      "selector": [
        "#homepage"
      ],
      "style": "ai-tabs",
      "blocks": [
        "tabs-feature"
      ],
      "defaultContent": []
    },
    {
      "id": "ai-assetinsights-tabs",
      "name": "See Asset Insights in Action tabs",
      "selector": [
        "main > section.integrations-feature"
      ],
      "style": "ai-tabs",
      "blocks": [
        "tabs-feature"
      ],
      "defaultContent": []
    },
    {
      "id": "ai-dual-cta",
      "name": "Dual CTA articles",
      "selector": [
        "main > section.dualCTA-box"
      ],
      "style": "ai-dual-cta",
      "blocks": [
        "cards-cta"
      ],
      "defaultContent": []
    },
    {
      "id": "optix-what-is-it",
      "name": "What is FactoryTalk Optix",
      "selector": [
        "main > section.what-is-it"
      ],
      "style": "optix-intro",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "optix-connect",
      "name": "Connect to plant floor icon grid + benefits",
      "selector": [
        "main > section.connect"
      ],
      "style": "optix-connect",
      "blocks": [
        "cards-icon"
      ],
      "defaultContent": [
        "main > section.connect > h2"
      ]
    },
    {
      "id": "optix-case-study",
      "name": "Case study quote + stats",
      "selector": [
        "main > section.case-study"
      ],
      "style": "optix-casestudy",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "optix-together",
      "name": "Fiix and FactoryTalk Better Together",
      "selector": [
        "main > section.together"
      ],
      "style": "optix-together",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "optix-getting-started",
      "name": "Getting Started CTA",
      "selector": [
        "main > section.container .get-started, main > section.get-started"
      ],
      "style": "optix-getstarted",
      "blocks": [
        "hero-cta"
      ],
      "defaultContent": []
    },
    {
      "id": "optix-faq",
      "name": "Optix FAQ accordion",
      "selector": [
        "main > section#RA-faq"
      ],
      "style": "optix-faq",
      "blocks": [
        "accordion-faq"
      ],
      "defaultContent": []
    }
  ]
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
      let elements = [];
      try {
        elements = document.querySelectorAll(selector);
      } catch (e) {
        console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
      }
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

    // 6. Generate sanitized path (map root to /index to avoid empty-path crash)
    const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
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
