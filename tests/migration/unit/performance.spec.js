const { test, expect } = require('@playwright/test');
const {
  clsScore,
  computePerformanceScore,
  metricScore,
} = require('../utils/performance.js');

test.describe('Lighthouse-style performance scoring', () => {
  test('returns 100 for strong Core Web Vitals', () => {
    expect(computePerformanceScore({
      fcp: 1200,
      lcp: 2000,
      load: 2000,
      cls: 0.02,
    })).toBe(100);
  });

  test('returns a lower score for slow load and paint times', () => {
    const score = computePerformanceScore({
      fcp: 2800,
      lcp: null,
      load: 7000,
      cls: 0.15,
    });
    expect(score).toBeLessThan(75);
    expect(score).toBeGreaterThan(0);
  });

  test('works when LCP is unavailable by using FCP', () => {
    expect(computePerformanceScore({
      fcp: 1500,
      lcp: null,
      load: 3000,
      cls: 0,
    })).toBeGreaterThan(80);
  });

  test('scores CLS using Lighthouse thresholds', () => {
    expect(clsScore(0.05)).toBe(100);
    expect(clsScore(0.2)).toBeLessThan(50);
    expect(metricScore(5000, 2500, 8000)).toBe(55);
  });
});
