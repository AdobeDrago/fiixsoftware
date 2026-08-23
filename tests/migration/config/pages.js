const {
  blogPages,
  caseStudyPages,
  indexPages,
  productPages,
  reviewPages,
} = require('./page-families.js');

const DEFAULT_MASKS = [
  '#drift-widget',
  '.drift-conductor-item',
  'iframe[title*="Drift"]',
  'iframe[src*="hotjar"]',
  'iframe[src*="marketo"]',
  '#onetrust-banner-sdk',
  '#onetrust-consent-sdk',
  '.cky-consent-container',
  '.cookie-notice',
  '[data-nosnippet="true"]',
];

const DEFAULT_EXCLUSIONS = [
  'script',
  'style',
  'noscript',
  'template',
  '[aria-hidden="true"]',
  '.sr-only',
  '.blog-body-sr-only',
  '.screen-reader-text',
  '.blog-share > .default-content-wrapper > p:first-child',
  '.blog-share > .default-content-wrapper > ul',
];

const common = {
  contentRoots: { live: '#content', eds: 'main' },
  globalRoots: {
    live: '.siteHeader, #mobile-header, #footer, #copyright',
    eds: 'header, footer',
  },
  excludeSelectors: DEFAULT_EXCLUSIONS,
  secondaryContentSelectors: [
    '.blog-share > .default-content-wrapper > p:nth-of-type(n+2)',
  ],
  maskSelectors: DEFAULT_MASKS,
  equivalentHosts: [
    'fiixsoftware.com',
    'www.fiixsoftware.com',
    'develop--fiixsoftware--adobedrago.aem.page',
    'develop--fiixsoftware--adobedrago.aem.live',
    'main--fiixsoftware--adobedrago.aem.page',
    'main--fiixsoftware--adobedrago.aem.live',
  ],
  ignoredQueryParameters: [
    /^utm_/i,
    /^_gl$/i,
    /^_gcl_/i,
    /^_ga(?:$|_)/i,
    /^gclid$/i,
    /^fbclid$/i,
    /^msclkid$/i,
  ],
  preserveHashes: false,
  visualThresholds: {
    pixel: 0.15,
    warning: 0.02,
    error: 0.20,
  },
};

const pathSlug = (path) => path.slice(1).replaceAll('/', '-');
const leafSlug = (path) => path.split('/').filter(Boolean).at(-1);

function pageConfig(name, path, pageType, tags, slug = pathSlug(path)) {
  return {
    ...common,
    name,
    slug,
    pageType,
    tags,
    live: `https://fiixsoftware.com${path}/`,
    eds: `https://develop--fiixsoftware--adobedrago.aem.page${path}`,
  };
}

const products = productPages.map(([name, path]) => (
  pageConfig(name, path, 'Product Page', ['@product'], `product-${leafSlug(path)}`)
));

const reviews = reviewPages.map(([name, path]) => (
  pageConfig(name, path, 'Reviews', ['@reviews'])
));

const indexes = indexPages.map(([name, path, pageType, tags]) => (
  pageConfig(name, path, pageType, tags)
));

const caseStudies = caseStudyPages.map(([name, path]) => (
  pageConfig(
    `Case Study: ${name}`,
    path,
    'Case Study Page',
    ['@case-studies'],
    `case-study-${leafSlug(path)}`,
  )
));

const blogs = blogPages.map(([name, path]) => (
  pageConfig(`Blog: ${name}`, path, 'Blog Post', ['@blog'], `blog-${leafSlug(path)}`)
));

module.exports = [...products, ...reviews, ...indexes, ...caseStudies, ...blogs];
