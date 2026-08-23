const { test } = require('@playwright/test');
const pages = require('./config/pages.js');
const viewports = require('./config/viewports.js');
const { compareAvailability, compareContentRoots } = require('./utils/availability.js');
const { compareContent } = require('./utils/compare-content.js');
const { compareImages } = require('./utils/compare-images.js');
const { compareLinks } = require('./utils/compare-links.js');
const { compareMetadata } = require('./utils/compare-metadata.js');
const { comparePaginationScope } = require('./utils/compare-pagination.js');
const { extractPage } = require('./utils/extract-page.js');
const { checkLinkHealth } = require('./utils/link-health.js');
const { openPair } = require('./utils/page-loader.js');
const { assertNoMigrationErrors, attachResult } = require('./utils/reporting.js');

test.describe('semantic migration validation', () => {
  pages.forEach((pageConfig) => {
    test(pageConfig.name, { tag: pageConfig.tags }, async ({ browser, request }, testInfo) => {
      const pair = await openPair(browser, pageConfig, viewports.desktop);
      const result = {
        page: pageConfig.name,
        pageType: pageConfig.pageType,
        slug: pageConfig.slug,
        liveUrl: pair.liveLoad.finalUrl,
        edsUrl: pair.edsLoad.finalUrl,
        viewport: null,
        findings: compareAvailability(pair.liveLoad, pair.edsLoad, pageConfig),
        artifacts: [],
      };
      try {
        if (!result.findings.some((item) => item.severity === 'ERROR')) {
          const [live, eds] = await Promise.all([
            extractPage(pair.livePage, 'live', pageConfig),
            extractPage(pair.edsPage, 'eds', pageConfig),
          ]);
          const rootFindings = compareContentRoots(live, eds, pageConfig);
          result.findings.push(...rootFindings);
          if (!rootFindings.length) {
            result.findings.push(...compareContent(live.content, eds.content));
            result.findings.push(...compareLinks(live.links, eds.links, pageConfig));
            result.findings.push(...compareImages(live.images, eds.images));
            result.findings.push(...compareMetadata(live.metadata, eds.metadata, pageConfig));
            result.findings.push(...comparePaginationScope(live, eds, pageConfig));
            result.findings.push(...await checkLinkHealth(
              request,
              live.links,
              eds.links,
              pageConfig,
            ));
          }
        }
      } finally {
        await pair.close();
      }
      await attachResult(testInfo, result);
      assertNoMigrationErrors(result);
    });
  });
});
