const { test } = require('@playwright/test');
const pages = require('./config/pages.js');
const viewports = require('./config/viewports.js');
const { compareAvailability, compareContentRoots } = require('./utils/availability.js');
const { compareResponsive } = require('./utils/compare-responsive.js');
const { comparePaginationScope } = require('./utils/compare-pagination.js');
const { extractPage } = require('./utils/extract-page.js');
const { openPair } = require('./utils/page-loader.js');
const { assertNoMigrationErrors, attachResult } = require('./utils/reporting.js');
const { capturePair, compareScreenshots } = require('./utils/visual.js');

test.describe('responsive and visual migration validation', () => {
  pages.forEach((pageConfig) => {
    Object.entries(viewports).forEach(([viewportName, viewport]) => {
      test(
        `${pageConfig.name} - ${viewportName}`,
        { tag: pageConfig.tags },
        async ({ browser }, testInfo) => {
          const pair = await openPair(browser, pageConfig, viewport);
          const result = {
            page: pageConfig.name,
            pageType: pageConfig.pageType,
            slug: pageConfig.slug,
            liveUrl: pair.liveLoad.finalUrl,
            edsUrl: pair.edsLoad.finalUrl,
            viewport: viewportName,
            findings: compareAvailability(
              pair.liveLoad,
              pair.edsLoad,
              pageConfig,
              viewportName,
            ),
            artifacts: [],
          };
          try {
            const paths = await capturePair(
              pair.livePage,
              pair.edsPage,
              pageConfig,
              viewportName,
            );
            result.artifacts.push(paths.livePath, paths.edsPath);
            await Promise.all([
              testInfo.attach(`${viewportName}-live`, { path: paths.livePath, contentType: 'image/png' }),
              testInfo.attach(`${viewportName}-eds`, { path: paths.edsPath, contentType: 'image/png' }),
            ]);
            if (!result.findings.some((item) => item.severity === 'ERROR')) {
              const [live, eds] = await Promise.all([
                extractPage(pair.livePage, 'live', pageConfig),
                extractPage(pair.edsPage, 'eds', pageConfig),
              ]);
              const rootFindings = compareContentRoots(
                live,
                eds,
                pageConfig,
                viewportName,
              );
              result.findings.push(...rootFindings);
              if (!rootFindings.length) {
                result.findings.push(...compareResponsive(
                  live,
                  eds,
                  viewportName,
                  viewport,
                ));
                result.findings.push(...comparePaginationScope(
                  live,
                  eds,
                  pageConfig,
                  viewportName,
                ));
              }
              const visual = compareScreenshots(
                paths,
                pageConfig.visualThresholds,
                viewportName,
              );
              result.findings.push(...visual.findings);
              result.artifacts.push(paths.diffPath);
              await testInfo.attach(`${viewportName}-diff`, {
                path: paths.diffPath,
                contentType: 'image/png',
              });
            }
          } finally {
            await pair.close();
          }
          await attachResult(testInfo, result);
          assertNoMigrationErrors(result);
        },
      );
    });
  });
});
