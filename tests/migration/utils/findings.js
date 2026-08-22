const SEVERITY_ORDER = { ERROR: 0, WARNING: 1, INFO: 2 };

function finding({
  severity,
  category,
  code,
  message,
  live = null,
  eds = null,
  context = null,
  viewport = null,
  artifacts = [],
}) {
  return {
    severity,
    category,
    code,
    message,
    live,
    eds,
    context,
    viewport,
    artifacts,
  };
}

function sortFindings(findings) {
  return [...findings].sort((left, right) => {
    const severity = SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity];
    if (severity !== 0) return severity;
    return left.category.localeCompare(right.category);
  });
}

function countBySeverity(findings) {
  return findings.reduce((counts, item) => {
    counts[item.severity] += 1;
    return counts;
  }, { ERROR: 0, WARNING: 0, INFO: 0 });
}

module.exports = { countBySeverity, finding, sortFindings };
