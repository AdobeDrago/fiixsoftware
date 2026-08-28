/**
 * Lighthouse accessibility audit weights.
 * Source: GoogleChrome/lighthouse core/config/default-config.js (accessibility.auditRefs)
 */
const LIGHTHOUSE_AUDIT_WEIGHTS = {
  accesskeys: 7,
  'aria-allowed-attr': 10,
  'aria-command-name': 7,
  'aria-conditional-attr': 7,
  'aria-deprecated-role': 1,
  'aria-dialog-name': 7,
  'aria-hidden-body': 10,
  'aria-hidden-focus': 7,
  'aria-input-field-name': 7,
  'aria-meter-name': 7,
  'aria-progressbar-name': 7,
  'aria-prohibited-attr': 7,
  'aria-required-attr': 10,
  'aria-required-children': 10,
  'aria-required-parent': 10,
  'aria-roles': 10,
  'aria-text': 7,
  'aria-toggle-field-name': 7,
  'aria-tooltip-name': 7,
  'aria-treeitem-name': 7,
  'aria-valid-attr-value': 10,
  'aria-valid-attr': 10,
  'button-name': 10,
  bypass: 7,
  'color-contrast': 7,
  'definition-list': 7,
  dlitem: 7,
  'document-title': 7,
  'duplicate-id-aria': 10,
  'form-field-multiple-labels': 3,
  'frame-title': 7,
  'heading-order': 3,
  'html-has-lang': 7,
  'html-lang-valid': 7,
  'html-xml-lang-mismatch': 3,
  'image-alt': 10,
  'input-button-name': 10,
  'input-image-alt': 10,
  label: 10,
  'link-in-text-block': 7,
  'link-name': 7,
  list: 7,
  listitem: 7,
  'meta-refresh': 10,
  'meta-viewport': 10,
  'object-alt': 7,
  'select-name': 10,
  'skip-link': 3,
  tabindex: 7,
  'target-size': 7,
  'td-headers-attr': 7,
  'th-has-data-cells': 7,
  'valid-lang': 7,
  'video-caption': 10,
  'landmark-one-main': 3,
  'autocomplete-valid': 1,
  'presentation-role-conflict': 1,
  'svg-img-alt': 1,
};

function computeLighthouseAccessibilityScore(axeResults) {
  const failingRules = new Set(axeResults.violations.map(({ id }) => id));
  const inapplicableRules = new Set(axeResults.inapplicable.map(({ id }) => id));

  let totalWeight = 0;
  let passedWeight = 0;

  Object.entries(LIGHTHOUSE_AUDIT_WEIGHTS).forEach(([auditId, weight]) => {
    if (weight === 0 || inapplicableRules.has(auditId)) return;
    totalWeight += weight;
    if (!failingRules.has(auditId)) passedWeight += weight;
  });

  if (totalWeight === 0) return 100;
  return Math.round((passedWeight / totalWeight) * 100);
}

function summarizeAxeResults(axeResults) {
  const failingAudits = axeResults.violations
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      nodes: violation.nodes?.length || 0,
      weight: LIGHTHOUSE_AUDIT_WEIGHTS[violation.id] || 0,
    }))
    .sort((left, right) => right.weight - left.weight || right.nodes - left.nodes);

  const scoredFailures = failingAudits.filter(({ weight }) => weight > 0);
  const issueCount = axeResults.violations.reduce(
    (sum, violation) => sum + (violation.nodes?.length || 0),
    0,
  );

  return {
    score: computeLighthouseAccessibilityScore(axeResults),
    issueCount,
    ruleCount: axeResults.violations.length,
    failedAuditCount: scoredFailures.length,
    passedAuditCount: Object.keys(LIGHTHOUSE_AUDIT_WEIGHTS).length - scoredFailures.length,
    topIssues: failingAudits.slice(0, 5),
    failingAudits: scoredFailures,
  };
}

module.exports = {
  LIGHTHOUSE_AUDIT_WEIGHTS,
  computeLighthouseAccessibilityScore,
  summarizeAxeResults,
};
