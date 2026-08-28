const { test, expect } = require('@playwright/test');
const {
  computeLighthouseAccessibilityScore,
  summarizeAxeResults,
} = require('../utils/lighthouse-accessibility.js');

function axeResults({ violations = [], inapplicable = [] } = {}) {
  return {
    violations,
    passes: [],
    inapplicable,
    incomplete: [],
  };
}

test.describe('Lighthouse accessibility scoring', () => {
  test('returns 100 when no scored audits fail', () => {
    const score = computeLighthouseAccessibilityScore(axeResults());
    expect(score).toBe(100);
  });

  test('penalizes a weighted audit once regardless of node count', () => {
    const score = computeLighthouseAccessibilityScore(axeResults({
      violations: [{
        id: 'button-name',
        impact: 'critical',
        description: 'Buttons must have discernible text',
        nodes: [{ html: '<button></button>' }, { html: '<button></button>' }],
      }],
    }));
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThan(80);
  });

  test('ignores zero-weight audits such as aria-allowed-role', () => {
    const withZeroWeight = computeLighthouseAccessibilityScore(axeResults({
      violations: [{
        id: 'aria-allowed-role',
        impact: 'minor',
        description: 'Roles must be appropriate',
        nodes: [{ html: '<div role="button"></div>' }],
      }],
    }));
    expect(withZeroWeight).toBe(100);
  });

  test('excludes inapplicable audits from the denominator', () => {
    const score = computeLighthouseAccessibilityScore(axeResults({
      inapplicable: [{ id: 'video-caption' }],
    }));
    expect(score).toBe(100);
  });

  test('summarizes failing audits by Lighthouse weight', () => {
    const summary = summarizeAxeResults(axeResults({
      violations: [
        {
          id: 'landmark-one-main',
          impact: 'moderate',
          description: 'Document should have one main landmark',
          nodes: Array.from({ length: 50 }, () => ({ html: '<div></div>' })),
        },
        {
          id: 'button-name',
          impact: 'critical',
          description: 'Buttons must have discernible text',
          nodes: [{ html: '<button></button>' }],
        },
      ],
    }));
    expect(summary.score).toBeLessThan(100);
    expect(summary.topIssues[0].id).toBe('button-name');
    expect(summary.failedAuditCount).toBe(2);
    expect(summary.issueCount).toBe(51);
  });
});
