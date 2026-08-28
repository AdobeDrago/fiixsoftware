const { test } = require('@playwright/test');
const pages = require('./config/pages.js');
const viewports = require('./config/viewports.js');
const { resolveEdsOrigin } = require('./config/environment.js');
const {
  edsUnavailableMessage,
  isEdsUnavailable,
} = require('./utils/availability.js');
const { collectAccessibility } = require('./utils/accessibility.js');
const { collectPerformance } = require('./utils/performance.js');
const { openPair } = require('./utils/page-loader.js');
const { selectPages } = require('./utils/select-pages.js');
const { capturePair, compareScreenshots } = require('./utils/visual.js');

const viewportName = process.env.COMPARISON_VIEWPORT || 'desktop';
const viewport = viewports[viewportName] || viewports.desktop;
const selectedPages = selectPages(pages);

test.describe('live vs eds comparison report', () => {
  selectedPages.forEach((pageConfig) => {
    test(
      pageConfig.name,
      { tag: pageConfig.tags },
      async ({ browser }, testInfo) => {
        const pair = await openPair(browser, pageConfig, viewport);
        const edsUnavailable = isEdsUnavailable(pair.edsLoad);
        const result = {
          meta: {
            generatedAt: new Date().toISOString(),
            edsOrigin: resolveEdsOrigin(),
            viewport: viewportName,
          },
          page: pageConfig.name,
          pageType: pageConfig.pageType,
          slug: pageConfig.slug,
          viewport: viewportName,
          liveUrl: pair.liveLoad.finalUrl,
          edsUrl: pair.edsLoad.finalUrl,
          availability: {
            live: pair.liveLoad,
            eds: pair.edsLoad,
          },
          skipped: edsUnavailable,
          skipReason: edsUnavailable ? edsUnavailableMessage(pair.edsLoad) : null,
          visual: null,
          accessibility: null,
          performance: null,
          sourceImages: {},
        };

        try {
          if (edsUnavailable) {
            process.stdout.write(`\nComparison: ${pageConfig.name} — skipped (${result.skipReason})\n`);
          } else {
            const paths = await capturePair(
              pair.livePage,
              pair.edsPage,
              pageConfig,
              viewportName,
            );
            result.sourceImages = {
              live: paths.livePath,
              eds: paths.edsPath,
              diff: paths.diffPath,
            };
            const visual = compareScreenshots(
              paths,
              pageConfig.visualThresholds,
              viewportName,
            );
            result.visual = {
              ratio: visual.ratio,
              heightRatio: visual.heightRatio,
              liveSize: visual.findings[0]?.live || null,
              edsSize: visual.findings[0]?.eds || null,
              heightDifference: visual.findings.find((item) => (
                item.code === 'PAGE_HEIGHT_DIFFERENCE'
              ))?.message?.match(/\d+/)?.[0] || null,
            };

            const [
              liveAccessibility,
              edsAccessibility,
              livePerformance,
              edsPerformance,
            ] = await Promise.all([
              collectAccessibility(pair.livePage),
              collectAccessibility(pair.edsPage),
              collectPerformance(pair.livePage),
              collectPerformance(pair.edsPage),
            ]);
            result.accessibility = {
              live: liveAccessibility,
              eds: edsAccessibility,
            };
            result.performance = {
              live: livePerformance,
              eds: edsPerformance,
            };
          }
        } finally {
          await pair.close();
        }

        await testInfo.attach('comparison-result', {
          body: Buffer.from(JSON.stringify(result, null, 2)),
          contentType: 'application/json',
        });
      },
    );
  });
});
