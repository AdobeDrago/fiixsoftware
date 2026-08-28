const { test, expect } = require('@playwright/test');
const pages = require('../config/pages.js');
const { parseSlugList, selectPages } = require('../utils/select-pages.js');

const samplePages = pages.slice(0, 5);

test.describe('comparison page selection', () => {
  test.afterEach(() => {
    delete process.env.COMPARISON_SLUGS;
    delete process.env.COMPARISON_LIMIT;
    delete process.env.COMPARISON_OFFSET;
  });

  test('returns all pages when no filters are set', () => {
    expect(selectPages(pages)).toHaveLength(67);
  });

  test('filters pages by slug list', () => {
    const [first, second] = samplePages;
    process.env.COMPARISON_SLUGS = `${first.slug},${second.slug}`;
    expect(selectPages(pages).map(({ slug }) => slug)).toEqual([first.slug, second.slug]);
  });

  test('rejects unknown slugs', () => {
    process.env.COMPARISON_SLUGS = 'missing-slug';
    expect(() => selectPages(pages)).toThrow(/Unknown COMPARISON_SLUGS/);
  });

  test('applies limit and offset after slug filtering', () => {
    process.env.COMPARISON_SLUGS = samplePages.map(({ slug }) => slug).join(',');
    process.env.COMPARISON_OFFSET = '1';
    process.env.COMPARISON_LIMIT = '2';
    expect(selectPages(pages)).toHaveLength(2);
    expect(selectPages(pages).map(({ slug }) => slug)).toEqual([
      samplePages[1].slug,
      samplePages[2].slug,
    ]);
  });

  test('parses slug lists from env values', () => {
    expect(parseSlugList(' a, b ,c ')).toEqual(['a', 'b', 'c']);
    expect(parseSlugList('')).toBeNull();
    expect(parseSlugList(undefined)).toBeNull();
  });
});
