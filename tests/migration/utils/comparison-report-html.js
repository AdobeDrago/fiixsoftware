const fs = require('fs');
const path = require('path');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatPercent(ratio) {
  if (ratio === null || ratio === undefined) return '—';
  return `${(ratio * 100).toFixed(2)}%`;
}

function scoreClass(score) {
  if (score >= 90) return 'good';
  if (score >= 75) return 'warn';
  return 'bad';
}

function visualClass(ratio) {
  if (ratio === null || ratio === undefined) return 'neutral';
  if (ratio <= 0.02) return 'good';
  if (ratio <= 0.10) return 'warn';
  return 'bad';
}

function renderScoreCell(score) {
  return `<td class="${scoreClass(score)}">${score}</td>`;
}

function renderSummaryRow(result) {
  if (result.skipped) {
    return `
    <tr>
      <td><a href="#${escapeHtml(result.slug)}">${escapeHtml(result.page)}</a></td>
      <td class="neutral" colspan="5">${escapeHtml(result.skipReason || 'EDS page unavailable')}</td>
    </tr>`;
  }
  const visual = result.visual || {};
  const liveA11y = result.accessibility?.live?.score;
  const edsA11y = result.accessibility?.eds?.score;
  const livePerf = result.performance?.live?.score;
  const edsPerf = result.performance?.eds?.score;
  return `
    <tr>
      <td><a href="#${escapeHtml(result.slug)}">${escapeHtml(result.page)}</a></td>
      <td class="${visualClass(visual.ratio)}">${formatPercent(visual.ratio)}</td>
      ${renderScoreCell(liveA11y)}
      ${renderScoreCell(edsA11y)}
      ${renderScoreCell(livePerf)}
      ${renderScoreCell(edsPerf)}
    </tr>`;
}

function renderScoreCard(label, score, note) {
  return `
    <article class="score-card ${scoreClass(score)}">
      <h4>${escapeHtml(label)}</h4>
      <p class="score">${score}/100</p>
      <p class="muted">${escapeHtml(note)}</p>
    </article>`;
}

function issueNote(summary) {
  if (!summary?.failedAuditCount) return 'All checks passed';
  const count = summary.failedAuditCount;
  return count === 1 ? '1 check needs attention' : `${count} checks need attention`;
}

function renderPageDetail(result) {
  if (result.skipped) {
    return `
    <section class="page-detail skipped" id="${escapeHtml(result.slug)}">
      <header>
        <h2>${escapeHtml(result.page)}</h2>
        <p class="meta">${escapeHtml(result.pageType || 'Page')} · ${escapeHtml(result.viewport)} viewport</p>
        <p class="links">
          <a href="${escapeHtml(result.liveUrl)}" target="_blank" rel="noreferrer">Live site</a>
          ·
          <a href="${escapeHtml(result.edsUrl)}" target="_blank" rel="noreferrer">EDS site</a>
        </p>
      </header>
      <div class="skip-banner">
        <strong>Comparison skipped</strong>
        <p>${escapeHtml(result.skipReason || 'EDS page unavailable')}. Visual, accessibility, and performance checks were not run.</p>
      </div>
    </section>`;
  }

  const visual = result.visual || {};
  const images = result.images || {};
  const liveA11y = result.accessibility?.live?.score ?? 0;
  const edsA11y = result.accessibility?.eds?.score ?? 0;
  const livePerf = result.performance?.live?.score ?? 0;
  const edsPerf = result.performance?.eds?.score ?? 0;

  return `
    <section class="page-detail" id="${escapeHtml(result.slug)}">
      <header>
        <h2>${escapeHtml(result.page)}</h2>
        <p class="meta">${escapeHtml(result.pageType || 'Page')} · ${escapeHtml(result.viewport)} viewport</p>
        <p class="links">
          <a href="${escapeHtml(result.liveUrl)}" target="_blank" rel="noreferrer">Live site</a>
          ·
          <a href="${escapeHtml(result.edsUrl)}" target="_blank" rel="noreferrer">EDS site</a>
        </p>
      </header>

      <div class="stat-grid">
        <div class="stat ${visualClass(visual.ratio)}">
          <span class="label">Visual difference</span>
          <strong>${formatPercent(visual.ratio)}</strong>
        </div>
        <div class="stat ${scoreClass(liveA11y)}">
          <span class="label">Live accessibility</span>
          <strong>${liveA11y}/100</strong>
        </div>
        <div class="stat ${scoreClass(edsA11y)}">
          <span class="label">EDS accessibility</span>
          <strong>${edsA11y}/100</strong>
        </div>
        <div class="stat ${scoreClass(livePerf)}">
          <span class="label">Live performance</span>
          <strong>${livePerf}/100</strong>
        </div>
        <div class="stat ${scoreClass(edsPerf)}">
          <span class="label">EDS performance</span>
          <strong>${edsPerf}/100</strong>
        </div>
      </div>

      <div class="visual-grid">
        <figure>
          <figcaption>Live</figcaption>
          <img src="${escapeHtml(images.live)}" alt="Live screenshot for ${escapeHtml(result.page)}" loading="lazy">
        </figure>
        <figure>
          <figcaption>EDS</figcaption>
          <img src="${escapeHtml(images.eds)}" alt="EDS screenshot for ${escapeHtml(result.page)}" loading="lazy">
        </figure>
        <figure>
          <figcaption>Difference</figcaption>
          <img src="${escapeHtml(images.diff)}" alt="Visual diff for ${escapeHtml(result.page)}" loading="lazy">
        </figure>
      </div>

      <div class="score-grid">
        ${renderScoreCard('Live accessibility', liveA11y, issueNote(result.accessibility?.live))}
        ${renderScoreCard('EDS accessibility', edsA11y, issueNote(result.accessibility?.eds))}
        ${renderScoreCard('Live performance', livePerf, 'Lighthouse-style speed score')}
        ${renderScoreCard('EDS performance', edsPerf, 'Lighthouse-style speed score')}
      </div>
    </section>`;
}

function buildComparisonReportHtml(meta, results) {
  const summaryRows = results.map(renderSummaryRow).join('');
  const pageDetails = results.map(renderPageDetail).join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Live vs EDS Comparison Report</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f4f6f8;
      --card: #fff;
      --text: #1b1f24;
      --muted: #5b6672;
      --line: #d8dee5;
      --good: #0f7b3a;
      --warn: #9a6700;
      --bad: #b42318;
      --neutral: #475467;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 16px/1.5 Inter, system-ui, sans-serif;
      color: var(--text);
      background: var(--bg);
    }
    main { max-width: 1400px; margin: 0 auto; padding: 24px; }
    h1, h2, h3, h4 { line-height: 1.2; margin: 0 0 12px; }
    p { margin: 0 0 8px; }
    .hero, .page-detail, .summary-card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .hero .meta, .page-detail .meta, .muted { color: var(--muted); }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .summary-table th, .summary-table td {
      border-bottom: 1px solid var(--line);
      padding: 10px 8px;
      text-align: left;
      vertical-align: top;
    }
    .summary-table th {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--muted);
    }
    .stat-grid, .score-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin: 16px 0 20px;
    }
    .stat, .score-card {
      background: #f9fafb;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 12px;
    }
    .stat .label { display: block; color: var(--muted); font-size: 13px; margin-bottom: 4px; }
    .score-card .score {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .visual-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .visual-grid figure {
      margin: 0;
      border: 1px solid var(--line);
      border-radius: 10px;
      overflow: hidden;
      background: #fff;
    }
    .visual-grid figcaption {
      padding: 8px 10px;
      font-size: 13px;
      color: var(--muted);
      border-bottom: 1px solid var(--line);
      background: #fafbfc;
    }
    .visual-grid img {
      display: block;
      width: 100%;
      height: auto;
    }
    .good { color: var(--good); }
    .warn { color: var(--warn); }
    .bad { color: var(--bad); }
    .neutral { color: var(--neutral); }
    .skip-banner {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 10px;
      padding: 16px;
      color: #9a3412;
    }
    .skip-banner p { margin-top: 8px; color: #7c2d12; }
    @media (max-width: 960px) {
      .visual-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <h1>Live vs EDS Comparison Report</h1>
      <p class="meta">Generated ${escapeHtml(meta.generatedAt)}</p>
      <p class="meta">EDS origin: ${escapeHtml(meta.edsOrigin)} · Viewport: ${escapeHtml(meta.viewport)} · Pages: ${results.length}</p>
      <p class="meta">Scores use the same 0–100 scale as Lighthouse in Chrome DevTools. Green is 90+, amber is 75–89, red is below 75.</p>
    </section>

    <section class="summary-card">
      <h2>Summary</h2>
      <table class="summary-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Visual diff</th>
            <th>Live accessibility</th>
            <th>EDS accessibility</th>
            <th>Live performance</th>
            <th>EDS performance</th>
          </tr>
        </thead>
        <tbody>${summaryRows}</tbody>
      </table>
    </section>

    ${pageDetails}
  </main>
</body>
</html>`;
}

function writeComparisonReport(outputDirectory, meta, results) {
  fs.mkdirSync(outputDirectory, { recursive: true });
  const html = buildComparisonReportHtml(meta, results);
  const htmlPath = path.join(outputDirectory, 'index.html');
  const jsonPath = path.join(outputDirectory, 'summary.json');
  fs.writeFileSync(htmlPath, html);
  fs.writeFileSync(jsonPath, `${JSON.stringify({ meta, results }, null, 2)}\n`);
  return { htmlPath, jsonPath };
}

module.exports = {
  buildComparisonReportHtml,
  writeComparisonReport,
};
