function metricScore(value, good, poor) {
  if (!Number.isFinite(value)) return null;
  if (value <= good) return 100;
  if (value >= poor) return 0;
  return Math.round((100 * (poor - value)) / (poor - good));
}

function clsScore(cls) {
  if (!Number.isFinite(cls)) return 100;
  if (cls <= 0.1) return 100;
  if (cls >= 0.25) return 0;
  return Math.round((100 * (0.25 - cls)) / 0.15);
}

/**
 * Lighthouse-style 0–100 performance score using Core Web Vitals thresholds.
 * Uses FCP/LCP for loading, load time for overall readiness, and CLS for stability.
 */
function computePerformanceScore(metrics) {
  const parts = [];
  const lcp = metricScore(metrics.lcp, 2500, 4000);
  const fcp = metricScore(metrics.fcp, 1800, 3000);
  const paintScore = lcp ?? fcp;
  if (paintScore !== null) parts.push({ score: paintScore, weight: 0.45 });

  const load = metricScore(metrics.load, 2500, 8000);
  if (load !== null) parts.push({ score: load, weight: 0.35 });

  parts.push({ score: clsScore(metrics.cls), weight: 0.2 });

  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);
  const weighted = parts.reduce((sum, part) => sum + (part.score * part.weight), 0);
  return Math.round(weighted / totalWeight);
}

async function collectPerformance(page) {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paints = performance.getEntriesByType('paint');
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const layoutShifts = performance.getEntriesByType('layout-shift')
      .filter((entry) => !entry.hadRecentInput);

    const round = (value) => (Number.isFinite(value) ? Math.round(value) : null);
    const cls = layoutShifts.reduce((sum, entry) => sum + entry.value, 0);

    return {
      ttfb: round(navigation?.responseStart),
      fcp: round(paints.find((entry) => entry.name === 'first-contentful-paint')?.startTime),
      lcp: round(lcpEntries.at(-1)?.startTime),
      domContentLoaded: round(navigation?.domContentLoadedEventEnd),
      load: round(navigation?.loadEventEnd),
      cls: Number(cls.toFixed(3)),
    };
  });

  return {
    score: computePerformanceScore(metrics),
  };
}

module.exports = {
  collectPerformance,
  computePerformanceScore,
  clsScore,
  metricScore,
};
