const { finding } = require('./findings.js');
const { isCheckableUrl, normalizeUrl } = require('./url.js');

const healthCache = new Map();

async function fetchHealth(request, url) {
  if (healthCache.has(url)) return healthCache.get(url);
  const promise = (async () => {
    try {
      let response = await request.head(url, {
        failOnStatusCode: false,
        maxRedirects: 10,
        timeout: 10000,
      });
      if ([400, 405, 501].includes(response.status())) {
        response = await request.get(url, {
          failOnStatusCode: false,
          maxRedirects: 10,
          timeout: 10000,
        });
      }
      return { status: response.status(), finalUrl: response.url(), error: null };
    } catch (error) {
      return { status: null, finalUrl: url, error: error.message };
    }
  })();
  healthCache.set(url, promise);
  return promise;
}

function healthFinding(link, health, side, config) {
  const label = link.label || link.href;
  if (health.error) {
    return finding({
      severity: 'WARNING',
      category: 'LINKS',
      code: 'LINK_UNVERIFIABLE',
      message: `${side} link could not be verified: "${label}"`,
      [side.toLocaleLowerCase('en-US')]: link.href,
      context: health.error,
    });
  }
  if ([404, 410].includes(health.status)) {
    return finding({
      severity: 'ERROR',
      category: 'LINKS',
      code: 'BROKEN_LINK',
      message: `${side} link returned HTTP ${health.status}: "${label}"`,
      [side.toLocaleLowerCase('en-US')]: link.href,
      context: link.context,
    });
  }
  if ([401, 403, 429].includes(health.status) || health.status >= 500) {
    return finding({
      severity: 'WARNING',
      category: 'LINKS',
      code: 'LINK_UNVERIFIABLE_STATUS',
      message: `${side} link returned HTTP ${health.status}: "${label}"`,
      [side.toLocaleLowerCase('en-US')]: link.href,
      context: link.context,
    });
  }
  const original = normalizeUrl(link.href, link.href, config);
  const final = normalizeUrl(health.finalUrl, health.finalUrl, config);
  if (original !== final) {
    return finding({
      severity: 'WARNING',
      category: 'LINKS',
      code: 'UNEXPECTED_REDIRECT',
      message: `${side} link redirects to a different destination: "${label}"`,
      [side.toLocaleLowerCase('en-US')]: link.href,
      context: health.finalUrl,
    });
  }
  return null;
}

async function checkLinkHealth(request, liveLinks, edsLinks, config) {
  const candidates = [];
  const seen = new Set();
  [['Live', liveLinks], ['Eds', edsLinks]].forEach(([side, links]) => {
    links.filter((link) => link.scope === 'content' && isCheckableUrl(link.href)).forEach((link) => {
      const key = `${side}:${link.href}`;
      if (!seen.has(key)) candidates.push({ side, link });
      seen.add(key);
    });
  });

  const findings = [];
  let cursor = 0;
  async function worker() {
    if (cursor >= candidates.length) return;
    const current = candidates[cursor];
    cursor += 1;
    const health = await fetchHealth(request, current.link.href);
    const result = healthFinding(current.link, health, current.side, config);
    if (result) findings.push(result);
    await worker();
  }
  await Promise.all(Array.from({ length: Math.min(4, candidates.length) }, () => worker()));
  return findings;
}

module.exports = { checkLinkHealth };
