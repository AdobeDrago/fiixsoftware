const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { PNG } = require('pngjs');
const pages = require('../config/pages.js');
const { compareAvailability } = require('../utils/availability.js');
const { compareContent, CONTENT_FUZZY_THRESHOLD } = require('../utils/compare-content.js');
const {
  compareImages,
  imageScore,
  IMAGE_MATCH_THRESHOLD,
} = require('../utils/compare-images.js');
const { compareLinks } = require('../utils/compare-links.js');
const { compareMetadata } = require('../utils/compare-metadata.js');
const { comparePaginationScope } = require('../utils/compare-pagination.js');
const { extractPage } = require('../utils/extract-page.js');
const { countBySeverity, finding } = require('../utils/findings.js');
const { normalizeText, similarity } = require('../utils/normalize.js');
const { normalizeUrl, urlsEquivalent } = require('../utils/url.js');
const { isBlockedHost } = require('../utils/page-loader.js');
const { compareScreenshots } = require('../utils/visual.js');

const config = pages[0];

function writeSolidPng(filePath, width, height, color) {
  const image = new PNG({ width, height, colorType: 6 });
  const [red, green, blue] = color;
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = red;
    image.data[index + 1] = green;
    image.data[index + 2] = blue;
    image.data[index + 3] = 255;
  }
  fs.writeFileSync(filePath, PNG.sync.write(image));
}

test.describe('migration normalizers and comparators', () => {
  test('normalizes equivalent WordPress and EDS URLs', () => {
    expect(urlsEquivalent(
      'https://fiixsoftware.com/resource-center/ebook/?utm_source=test',
      'https://develop--fiixsoftware--adobedrago.aem.page/resource-center/ebook',
      config.live,
      config.eds,
      config,
    )).toBe(true);
  });

  test('preserves meaningful parameters and sorts their order', () => {
    const normalized = normalizeUrl(
      '/resource-center/ebook/?b=2&utm_campaign=test&a=1',
      config.live,
      config,
    );
    expect(normalized).toBe('{site}/resource-center/ebook?a=1&b=2');
    expect(normalizeUrl('/page?product=cmms', config.live, config))
      .toContain('product=cmms');
  });

  test('normalizes whitespace, typography, and terminal punctuation', () => {
    expect(normalizeText('  Modern\u00a0maintenance\u2014today.  '))
      .toBe('Modern maintenance-today');
  });

  test('extracts blockquote text and attribution as semantic paragraphs', async ({ page }) => {
    await page.setContent(`
      <main>
        <h2>Before Fiix</h2>
        <blockquote>
          A maintenance quote<br>
          <span>– Maintenance manager</span>
        </blockquote>
      </main>
    `);
    const extracted = await extractPage(page, 'live', {
      contentRoots: { live: 'main' },
      globalRoots: { live: 'header,footer' },
      excludeSelectors: [],
    });
    expect(extracted.content.map(({ kind, text }) => ({ kind, text }))).toEqual([
      { kind: 'heading', text: 'Before Fiix' },
      { kind: 'paragraph', text: 'A maintenance quote' },
      { kind: 'paragraph', text: '– Maintenance manager' },
    ]);
    const equivalentParagraphs = extracted.content.map((item) => ({
      ...item,
      tag: item.kind === 'paragraph' ? 'P' : item.tag,
    }));
    expect(compareContent(extracted.content, equivalentParagraphs)
      .filter((item) => item.severity === 'ERROR')).toHaveLength(0);
  });

  test('extracts and reports explicit index pagination', async ({ page }) => {
    await page.setContent(`
      <main>
        <h1>Blog</h1>
        <nav class="pagination"><a class="page-numbers" href="/blog/page/2/">2</a></nav>
      </main>
    `);
    const extracted = await extractPage(page, 'eds', {
      contentRoots: { eds: 'main' },
      globalRoots: { eds: 'header,footer' },
      excludeSelectors: [],
    });
    expect(extracted.pagination).toEqual([
      expect.objectContaining({ label: '2', href: '/blog/page/2/' }),
    ]);
    expect(comparePaginationScope(
      extracted,
      { pagination: [] },
      { pageType: 'Blog Index Page' },
    )).toContainEqual(expect.objectContaining({
      severity: 'WARNING',
      code: 'SOURCE_PAGINATION_DETECTED',
    }));
  });

  test('blocks audited tracking hosts without blocking site assets', () => {
    expect(isBlockedHost('scripts.clarity.ms')).toBe(true);
    expect(isBlockedHost('cdn.cookielaw.org')).toBe(true);
    expect(isBlockedHost('snap.licdn.com')).toBe(true);
    expect(isBlockedHost('use.typekit.net')).toBe(false);
    expect(isBlockedHost('fiixsoftware.com')).toBe(false);
  });

  test('classifies missing, changed, and heading-level content', () => {
    const live = [
      {
        kind: 'heading', tag: 'H2', text: 'Maintenance resources', context: '',
      },
      {
        kind: 'paragraph', tag: 'P', text: 'Improve asset reliability today', context: '',
      },
      {
        kind: 'paragraph', tag: 'P', text: 'Source-only paragraph', context: '',
      },
    ];
    const eds = [
      {
        kind: 'heading', tag: 'H3', text: 'Maintenance resources', context: '',
      },
      {
        kind: 'paragraph', tag: 'P', text: 'Improve asset performance today', context: '',
      },
    ];
    const findings = compareContent(live, eds);
    expect(findings.some((item) => item.code === 'MISSING_CONTENT')).toBe(true);
    expect(findings.some((item) => item.code === 'CHANGED_CONTENT')).toBe(true);
    expect(findings.some((item) => item.code === 'HEADING_LEVELS_CHANGED')).toBe(true);
  });

  test('matches duplicate text by card context before position', () => {
    const live = [
      {
        kind: 'paragraph', tag: 'P', text: 'Ebook', context: 'New toolkit',
      },
      {
        kind: 'paragraph', tag: 'P', text: 'Ebook', context: 'Existing guide',
      },
    ];
    const eds = [
      {
        kind: 'paragraph', tag: 'P', text: 'Ebook', context: 'Existing guide',
      },
    ];
    const findings = compareContent(live, eds);
    const missing = findings.filter((item) => item.code === 'MISSING_CONTENT');
    expect(missing).toHaveLength(1);
    expect(missing[0].context).toBe('New toolkit');
  });

  test('reports meaningful content reordering', () => {
    const item = (text) => ({
      kind: 'heading', tag: 'H2', text, context: '',
    });
    const findings = compareContent(
      [item('First'), item('Second'), item('Third')],
      [item('Second'), item('First'), item('Third')],
    );
    expect(findings.some((findingItem) => findingItem.code === 'CONTENT_ORDER_CHANGED'))
      .toBe(true);
  });

  test('keeps fuzzy content sensitivity stable near its threshold', () => {
    const item = (text) => ({
      kind: 'paragraph', tag: 'P', text, context: 'Planning',
    });
    const justBelow = similarity('maintenance schedule', 'maintenance planning');
    const above = similarity('maintenance schedule', 'maintenance planner');
    expect(justBelow).toBeLessThan(CONTENT_FUZZY_THRESHOLD);
    expect(CONTENT_FUZZY_THRESHOLD - justBelow).toBeLessThan(0.01);
    expect(above).toBeGreaterThan(CONTENT_FUZZY_THRESHOLD);
    expect(above - CONTENT_FUZZY_THRESHOLD).toBeLessThan(0.02);
    expect(compareContent(
      [item('maintenance schedule')],
      [item('maintenance planning')],
    ).map(({ code }) => code)).toEqual(['MISSING_CONTENT', 'UNEXPECTED_CONTENT']);
    expect(compareContent(
      [item('maintenance schedule')],
      [item('maintenance planner')],
    )).toContainEqual(expect.objectContaining({ code: 'CHANGED_CONTENT' }));
  });

  test('matches repeated link identities after preserving exact destinations', () => {
    const link = (href) => ({
      label: 'Learn more', context: 'Maintenance guide', scope: 'content', href,
    });
    const findings = compareLinks(
      [link('/first'), link('/preserved')],
      [link('/preserved'), link('/replacement')],
      config,
    );
    expect(findings).toEqual([
      expect.objectContaining({
        code: 'LINK_DESTINATION_CHANGED',
        live: '/first',
        eds: '/replacement',
      }),
    ]);
  });

  test('reports meaningful page redirects but ignores normalized host redirects', () => {
    const load = (requestedUrl, finalUrl) => ({
      requestedUrl, finalUrl, status: 200, ok: true, error: null,
    });
    const equivalent = compareAvailability(
      load(`${config.live}/?utm_source=test`, config.eds),
      load(config.eds, `${config.eds}/`),
      config,
    );
    expect(equivalent).toHaveLength(0);
    const redirected = compareAvailability(
      load(config.live, config.live),
      load(config.eds, new URL('/different-page', config.eds).href),
      config,
      'desktop',
    );
    expect(redirected).toContainEqual(expect.objectContaining({
      severity: 'WARNING',
      code: 'EDS_PAGE_REDIRECTED',
      viewport: 'desktop',
    }));
  });

  test('matches transformed images using semantic signals', () => {
    const score = imageScore(
      {
        alt: 'Maintenance toolkit', context: 'Toolkit', src: '/toolkit-960x520.png', width: 960, height: 520,
      },
      {
        alt: 'Maintenance toolkit', context: 'Toolkit', src: '/media_abcd.webp', width: 480, height: 260,
      },
    );
    expect(score).toBeGreaterThan(0.8);
  });

  test('keeps image matching sensitivity stable around its threshold', () => {
    const commonImage = {
      context: '', src: '/toolkit.png', width: 960, height: 520,
    };
    const below = imageScore(
      { ...commonImage, alt: 'Maintenance toolkit' },
      { ...commonImage, alt: 'Maintenance toolkits' },
    );
    const above = imageScore(
      { ...commonImage, alt: 'Maintenance toolkit' },
      {
        ...commonImage, alt: 'Maintenance toolkit', width: 500, height: 500,
      },
    );
    expect(below).toBeLessThan(IMAGE_MATCH_THRESHOLD);
    expect(IMAGE_MATCH_THRESHOLD - below).toBeLessThan(0.01);
    expect(above).toBeGreaterThan(IMAGE_MATCH_THRESHOLD);
    expect(above - IMAGE_MATCH_THRESHOLD).toBeLessThanOrEqual(0.05);
  });

  test('distinguishes incomplete lazy images from broken images', () => {
    const image = {
      alt: 'Maintenance team',
      context: 'Results',
      src: '/maintenance-team.png',
      decorative: false,
    };
    const incomplete = compareImages([], [{
      ...image, complete: false, loaded: false,
    }]);
    expect(incomplete).toContainEqual(expect.objectContaining({
      severity: 'WARNING',
      code: 'EDS_IMAGE_LOAD_INCOMPLETE',
    }));
    expect(incomplete.some((item) => item.code === 'BROKEN_EDS_IMAGE')).toBe(false);

    const broken = compareImages([], [{
      ...image, complete: true, loaded: false,
    }]);
    expect(broken).toContainEqual(expect.objectContaining({
      severity: 'ERROR',
      code: 'BROKEN_EDS_IMAGE',
    }));
  });

  test('treats metadata punctuation as warning and domain changes as info', () => {
    const findings = compareMetadata({
      title: 'Maintenance Ebooks | Fiix',
      description: 'Modern maintenance.',
      canonical: config.live,
      ogUrl: config.live,
    }, {
      title: 'Maintenance Ebooks | Fiix',
      description: 'Modern maintenance',
      canonical: config.eds,
      ogUrl: config.eds,
    }, config);
    expect(findings.some((item) => item.code === 'METADATA_PUNCTUATION_CHANGED')).toBe(true);
    expect(findings.filter((item) => item.code === 'EXPECTED_URL_DOMAIN_CHANGE')).toHaveLength(2);
  });

  test('counts severities used by the exit policy', () => {
    const findings = [
      finding({
        severity: 'ERROR', category: 'CONTENT', code: 'E', message: 'error',
      }),
      finding({
        severity: 'WARNING', category: 'VISUAL', code: 'W', message: 'warning',
      }),
      finding({
        severity: 'INFO', category: 'URLS', code: 'I', message: 'info',
      }),
    ];
    expect(countBySeverity(findings)).toEqual({ ERROR: 1, WARNING: 1, INFO: 1 });
    expect(findings.filter((item) => item.severity === 'ERROR')).toHaveLength(1);
  });

  test('separates overlap pixel drift from page-height drift', () => {
    const testInfo = test.info();
    const livePath = testInfo.outputPath('live.png');
    const edsPath = testInfo.outputPath('eds.png');
    const diffPath = testInfo.outputPath('diff.png');
    writeSolidPng(livePath, 10, 10, [0, 0, 0]);
    writeSolidPng(edsPath, 10, 20, [0, 0, 0]);
    const visual = compareScreenshots(
      { livePath, edsPath, diffPath },
      { pixel: 0.15, warning: 0.02, error: 0.20 },
      'mobile',
    );
    expect(visual.ratio).toBe(0);
    expect(visual.findings).toContainEqual(expect.objectContaining({
      severity: 'INFO',
      code: 'VISUAL_WITHIN_TOLERANCE',
    }));
    expect(visual.findings).toContainEqual(expect.objectContaining({
      severity: 'ERROR',
      code: 'PAGE_HEIGHT_DIFFERENCE',
    }));
    expect(PNG.sync.read(fs.readFileSync(diffPath))).toMatchObject({
      width: 10,
      height: 20,
    });
  });
});
