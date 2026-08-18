/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import accordionFaqParser from './parsers/accordion-faq.js';
import cardsCtaParser from './parsers/cards-cta.js';
import cardsFeaturesParser from './parsers/cards-features.js';
import cardsTestimonialParser from './parsers/cards-testimonial.js';
import cardsVideoParser from './parsers/cards-video.js';
import carouselTestimonialParser from './parsers/carousel-testimonial.js';
import columnsCalloutParser from './parsers/columns-callout.js';
import columnsLogosParser from './parsers/columns-logos.js';
import columnsMediaParser from './parsers/columns-media.js';
import heroLeadParser from './parsers/hero-lead.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/fiix-cleanup.js';
import sectionsTransformer from './transformers/fiix-sections.js';

// PARSER REGISTRY
const parsers = {
  'accordion-faq': accordionFaqParser,
  'cards-cta': cardsCtaParser,
  'cards-features': cardsFeaturesParser,
  'cards-testimonial': cardsTestimonialParser,
  'cards-video': cardsVideoParser,
  'carousel-testimonial': carouselTestimonialParser,
  'columns-callout': columnsCalloutParser,
  'columns-logos': columnsLogosParser,
  'columns-media': columnsMediaParser,
  'hero-lead': heroLeadParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "product-feature-page",
  "description": "Classic Fiix product/feature page (WordPress #cmms-product / #page-wrap shell): hero with email capture + review-logo strip, customer logo band, alternating 2-3 column feature sections with supporting imagery, testimonial cards, case-study carousel, 'Explore our full maintenance solution' features explorer/accordion, resource-card trio, optional FAQ accordion, final CTA band.",
  "urls": [
    "https://fiixsoftware.com/cmms/cmms-software/",
    "https://fiixsoftware.com/cmms/mobile-cmms/",
    "https://fiixsoftware.com/cmms/asset-management-software/",
    "https://fiixsoftware.com/cmms/parts-inventory-management-software/"
  ],
  "blocks": [
    {
      "name": "hero-lead",
      "instances": [
        ".header"
      ]
    },
    {
      "name": "columns-logos",
      "instances": [
        ".fiix-users",
        ".section6 .social-badges"
      ]
    },
    {
      "name": "cards-features",
      "instances": [
        ".section1",
        ".section3:not(.section3last):not(.section3r)",
        ".section5:not(.section5r):not(.section5last)",
        ".section3r",
        ".section5r",
        ".section3.section3last"
      ]
    },
    {
      "name": "cards-video",
      "instances": [
        ".video-demo"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        ".section2:not(.section2last)",
        ".section4:not(.section4r)",
        "#analyze-audits",
        ".section4r",
        ".section2.section2last"
      ]
    },
    {
      "name": "cards-testimonial",
      "instances": [
        ".social-proof-ratings"
      ]
    },
    {
      "name": "carousel-testimonial",
      "instances": [
        ".section6 #features-ent"
      ]
    },
    {
      "name": "columns-callout",
      "instances": [
        ".section5r .cta-full, .section5r .stats"
      ]
    },
    {
      "name": "accordion-faq",
      "instances": [
        ".section6 .faq-accordion"
      ]
    },
    {
      "name": "cards-cta",
      "instances": [
        ".section7"
      ]
    }
  ],
  "sections": [
    {
      "id": "pf-hero",
      "name": "Hero",
      "selector": [
        ".header"
      ],
      "style": "pf-hero",
      "blocks": [
        "hero-lead",
        "columns-logos"
      ],
      "defaultContent": []
    },
    {
      "id": "pf-logos",
      "name": "Customer logo band",
      "selector": [
        ".fiix-users"
      ],
      "style": "pf-logos",
      "blocks": [
        "columns-logos"
      ],
      "defaultContent": [
        ".fiix-users h2"
      ]
    },
    {
      "id": "pf-workorders-features",
      "name": "Work order feature blurbs",
      "selector": [
        ".section1"
      ],
      "style": "pf-features",
      "blocks": [
        "cards-features"
      ],
      "defaultContent": [
        ".section1 > .container > h2",
        ".section1 > .container > p"
      ]
    },
    {
      "id": "pf-video-demos",
      "name": "Two-minute demos",
      "selector": [
        ".video-demo"
      ],
      "style": "pf-video",
      "blocks": [
        "cards-video"
      ],
      "defaultContent": [
        ".video-demo h2"
      ]
    },
    {
      "id": "pf-asset-track-media",
      "name": "Track/optimize asset (image+text)",
      "selector": [
        ".section2:not(.section2last)"
      ],
      "style": "pf-media-left",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "pf-asset-features",
      "name": "Asset feature grid",
      "selector": [
        ".section3:not(.section3last):not(.section3r)"
      ],
      "style": "pf-features",
      "blocks": [
        "cards-features"
      ],
      "defaultContent": []
    },
    {
      "id": "pf-testimonials",
      "name": "Testimonial cards",
      "selector": [
        ".social-proof-ratings"
      ],
      "style": "pf-testimonials",
      "blocks": [
        "cards-testimonial"
      ],
      "defaultContent": [
        ".social-proof-ratings h2"
      ]
    },
    {
      "id": "pf-inventory-media",
      "name": "Purchase/organize inventory (image+text)",
      "selector": [
        ".section4:not(.section4r)"
      ],
      "style": "pf-media-right",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "pf-inventory-features",
      "name": "Inventory feature grid",
      "selector": [
        ".section5:not(.section5r):not(.section5last)"
      ],
      "style": "pf-features",
      "blocks": [
        "cards-features"
      ],
      "defaultContent": []
    },
    {
      "id": "pf-analyze-media",
      "name": "Collect/analyze data (image+text)",
      "selector": [
        "#analyze-audits"
      ],
      "style": "pf-media-left",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "pf-analyze-features",
      "name": "Analytics feature grid",
      "selector": [
        ".section3r"
      ],
      "style": "pf-features",
      "blocks": [
        "cards-features"
      ],
      "defaultContent": []
    },
    {
      "id": "pf-integrate-media",
      "name": "Integrate CMMS (image+text)",
      "selector": [
        ".section4r"
      ],
      "style": "pf-media-right",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "pf-integrate-features-callout",
      "name": "Integration features + stats callout",
      "selector": [
        ".section5r"
      ],
      "style": "pf-features",
      "blocks": [
        "cards-features",
        "columns-callout"
      ],
      "defaultContent": []
    },
    {
      "id": "pf-mobile-media",
      "name": "Manage from anywhere (image+text)",
      "selector": [
        ".section2.section2last"
      ],
      "style": "pf-media-left",
      "blocks": [
        "columns-media"
      ],
      "defaultContent": []
    },
    {
      "id": "pf-mobile-features",
      "name": "Mobile feature grid",
      "selector": [
        ".section3.section3last"
      ],
      "style": "pf-features",
      "blocks": [
        "cards-features"
      ],
      "defaultContent": []
    },
    {
      "id": "pf-casestudy-carousel",
      "name": "Case study + explore solution",
      "selector": [
        ".section6"
      ],
      "style": "pf-explore",
      "blocks": [
        "carousel-testimonial",
        "columns-logos",
        "accordion-faq"
      ],
      "defaultContent": [
        ".section6 > .container > h2"
      ]
    },
    {
      "id": "pf-resources",
      "name": "Resource card trio",
      "selector": [
        ".section7"
      ],
      "style": "pf-resources",
      "blocks": [
        "cards-cta"
      ],
      "defaultContent": [
        ".section7 > .container > h2"
      ]
    },
    {
      "id": "pf-final-cta",
      "name": "Final CTA",
      "selector": [
        ".home-seemore"
      ],
      "style": "pf-final-cta",
      "blocks": [],
      "defaultContent": [
        ".home-seemore h2",
        ".home-seemore p",
        ".home-seemore .container ul"
      ]
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
