const { countBySeverity, sortFindings } = require('./findings.js');

function valueLines(label, value) {
  if (value === null || value === undefined) return [];
  const rendered = Array.isArray(value) ? value.join(' | ') : String(value);
  return [`    ${label}: ${rendered}`];
}

function formatResult(result) {
  const findings = sortFindings(result.findings);
  const counts = countBySeverity(findings);
  const lines = [
    '==================================================',
    'Migration Validation',
    '==================================================',
    `Page: ${result.page}`,
    `Page type: ${result.pageType || 'Unspecified'}`,
    `Live: ${result.liveUrl}`,
    `EDS: ${result.edsUrl}`,
    `Viewport: ${result.viewport || 'desktop semantic'}`,
    `Totals: ${counts.ERROR} error(s), ${counts.WARNING} warning(s), ${counts.INFO} info`,
  ];
  let category = null;
  findings.forEach((item) => {
    if (item.category !== category) {
      category = item.category;
      lines.push('', '--------------------------------------------------', category, '--------------------------------------------------');
    }
    lines.push(`[${item.severity}] ${item.message}`);
    lines.push(...valueLines('Live', item.live));
    lines.push(...valueLines('EDS', item.eds));
    lines.push(...valueLines('Context', item.context));
  });
  if (!findings.length) lines.push('', 'No migration differences found.');
  return lines.join('\n');
}

function formatResultStatus(result) {
  const counts = countBySeverity(result.findings);
  const scope = result.viewport || 'desktop semantic';
  return `${result.page} [${scope}]: ${counts.ERROR} error(s), ${counts.WARNING} warning(s), ${counts.INFO} info`;
}

async function attachResult(testInfo, result) {
  const json = JSON.stringify(result, null, 2);
  await testInfo.attach('migration-result', {
    body: Buffer.from(json),
    contentType: 'application/json',
  });
  await testInfo.attach('migration-summary', {
    body: Buffer.from(formatResult(result)),
    contentType: 'text/plain',
  });
}

module.exports = { attachResult, formatResult, formatResultStatus };
