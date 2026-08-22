const { test, expect } = require('@playwright/test');
const caseStudySnapshot = require('../../../blocks/case-study-listing/case-study-listing.json');
const blogSnapshot = require('../../../widgets/blog-listing/blog-listing.json');
const {
  blogPages,
  caseStudyPages,
} = require('../config/page-families.js');
const pages = require('../config/pages.js');
const { formatResult } = require('../utils/reporting.js');

const expectedPageTypes = new Set([
  'Product Page',
  'Reviews',
  'Resource Center Index Page',
  'Ebook Index Page',
  'Case Study Index Page',
  'Case Study Page',
  'Blog Index Page',
  'Blog Post',
]);

const paths = (entries) => entries.map(([, path]) => path).sort();
const snapshotPaths = (snapshot) => snapshot.data.map(({ path }) => path).sort();

test.describe('migration page configuration', () => {
  test('contains exactly 67 unique supplied mappings', () => {
    expect(pages).toHaveLength(67);
    expect(new Set(pages.map(({ name }) => name)).size).toBe(67);
    expect(new Set(pages.map(({ slug }) => slug)).size).toBe(67);
    expect(new Set(pages.map(({ live }) => live)).size).toBe(67);
    expect(new Set(pages.map(({ eds }) => eds)).size).toBe(67);
  });

  test('assigns valid page types, tags, and matching URL paths', () => {
    pages.forEach((page) => {
      expect(expectedPageTypes.has(page.pageType)).toBeTruthy();
      expect(page.tags.length).toBeGreaterThan(0);
      page.tags.forEach((tag) => expect(tag).toMatch(/^@[a-z-]+$/));
      expect(new URL(page.live).pathname.replace(/\/$/, ''))
        .toBe(new URL(page.eds).pathname.replace(/\/$/, ''));
    });
  });

  test('keeps all expected case-study paths aligned with the listing snapshot', () => {
    expect(caseStudyPages).toHaveLength(31);
    expect(paths(caseStudyPages)).toEqual(snapshotPaths(caseStudySnapshot));
    expect(pages.filter(({ pageType }) => pageType === 'Case Study Page')).toHaveLength(31);
  });

  test('keeps all expected blog paths aligned with the listing snapshot', () => {
    expect(blogPages).toHaveLength(25);
    expect(paths(blogPages)).toEqual(snapshotPaths(blogSnapshot));
    expect(pages.filter(({ pageType }) => pageType === 'Blog Post')).toHaveLength(25);
  });

  test('preserves the supplied asset-catelog URL spelling', () => {
    expect(blogPages.some(([, path]) => (
      path === '/blog/maintenance-assistant-facilitates-practical-asset-catelog'
    ))).toBeTruthy();
  });

  test('includes page type in human-readable reports', () => {
    const output = formatResult({
      page: pages[0].name,
      pageType: pages[0].pageType,
      liveUrl: pages[0].live,
      edsUrl: pages[0].eds,
      viewport: null,
      findings: [],
    });
    expect(output).toContain(`Page type: ${pages[0].pageType}`);
  });
});
