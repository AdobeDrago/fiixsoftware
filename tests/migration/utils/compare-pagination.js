const { finding } = require('./findings.js');

function comparePaginationScope(live, eds, pageConfig, viewport = null) {
  if (!/Index Page$/.test(pageConfig.pageType || '') || !live.pagination?.length) return [];
  const livePages = [...new Set(live.pagination.map(({ href }) => href))];
  const edsPages = [...new Set((eds.pagination || []).map(({ href }) => href))];
  return [finding({
    severity: 'WARNING',
    category: 'CONTENT',
    code: 'SOURCE_PAGINATION_DETECTED',
    message: 'WordPress uses explicit pagination; this result compares the rendered index page while supplied detail mappings are validated separately',
    live: livePages,
    eds: edsPages,
    context: pageConfig.pageType,
    viewport,
  })];
}

module.exports = { comparePaginationScope };
