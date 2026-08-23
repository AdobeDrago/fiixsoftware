const { test, expect } = require('@playwright/test');
const pages = require('../config/pages.js');
const { compareContent } = require('../utils/compare-content.js');
const { compareImages, imageScore } = require('../utils/compare-images.js');
const { compareMetadata } = require('../utils/compare-metadata.js');
const { extractPage } = require('../utils/extract-page.js');
const { countBySeverity, finding } = require('../utils/findings.js');
const { normalizeText } = require('../utils/normalize.js');
const { normalizeUrl, urlsEquivalent } = require('../utils/url.js');

const config = pages[0];

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
});
