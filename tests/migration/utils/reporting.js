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

function findingDetail(item) {
  const values = [];
  if (item.live !== null && item.live !== undefined) {
    values.push(`Live: ${Array.isArray(item.live) ? item.live.join(' | ') : item.live}`);
  }
  if (item.eds !== null && item.eds !== undefined) {
    values.push(`EDS: ${Array.isArray(item.eds) ? item.eds.join(' | ') : item.eds}`);
  }
  if (item.context) values.push(`Context: ${item.context}`);
  return values.length ? ` (${values.join('; ')})` : '';
}

function formatFailureSummary(result) {
  const errors = result.findings.filter(({ severity }) => severity === 'ERROR');
  if (!errors.length) return '';
  const groups = new Map();
  errors.forEach((item) => {
    const key = `${item.category}/${item.code}`;
    if (!groups.has(key)) groups.set(key, { count: 0, example: item });
    groups.get(key).count += 1;
  });
  const counts = countBySeverity(result.findings);
  const scope = result.viewport || 'desktop semantic';
  const bullets = [...groups.entries()].map(([key, group]) => {
    const count = group.count > 1 ? ` (${group.count} findings)` : '';
    return `- [${key}]${count} ${group.example.message}${findingDetail(group.example)}`;
  });
  return [
    `Migration error summary — ${result.page} [${scope}]`,
    '',
    ...bullets,
    '',
    `${counts.WARNING} warning(s) and ${counts.INFO} info finding(s) are available in the migration-summary attachment.`,
  ].join('\n');
}

function assertNoMigrationErrors(result) {
  if (result.findings.some(({ severity }) => severity === 'ERROR')) {
    throw new Error(formatFailureSummary(result));
  }
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
  const failureSummary = formatFailureSummary(result);
  if (failureSummary) {
    await testInfo.attach('migration-error-summary', {
      body: Buffer.from(failureSummary),
      contentType: 'text/plain',
    });
  }
}

module.exports = {
  assertNoMigrationErrors,
  attachResult,
  formatFailureSummary,
  formatResult,
  formatResultStatus,
};
