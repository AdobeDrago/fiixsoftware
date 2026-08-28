const { finding } = require('./findings.js');
const { normalizeUrl } = require('./url.js');

function redirectFinding(load, side, config, viewport) {
  if (!load.ok || !load.requestedUrl || !load.finalUrl) return null;
  const requested = normalizeUrl(load.requestedUrl, load.requestedUrl, config);
  const final = normalizeUrl(load.finalUrl, load.requestedUrl, config);
  if (requested === final) return null;
  const isLive = side === 'live';
  return finding({
    severity: 'WARNING',
    category: 'AVAILABILITY',
    code: isLive ? 'LIVE_PAGE_REDIRECTED' : 'EDS_PAGE_REDIRECTED',
    message: `${isLive ? 'WordPress benchmark' : 'EDS page'} redirected away from the configured mapping`,
    live: isLive ? load.finalUrl : null,
    eds: isLive ? null : load.finalUrl,
    context: `Requested: ${load.requestedUrl}`,
    viewport,
  });
}

function compareAvailability(liveLoad, edsLoad, config = {}, viewport = null) {
  const findings = [];
  if (!liveLoad.ok) {
    findings.push(finding({
      severity: 'ERROR',
      category: 'AVAILABILITY',
      code: 'LIVE_PAGE_UNAVAILABLE',
      message: `WordPress benchmark is unavailable (${liveLoad.status || liveLoad.error || 'no response'})`,
      live: liveLoad.finalUrl,
      viewport,
    }));
  }
  if (!edsLoad.ok) {
    findings.push(finding({
      severity: 'ERROR',
      category: 'AVAILABILITY',
      code: 'EDS_PAGE_UNAVAILABLE',
      message: `EDS page is unavailable (${edsLoad.status || edsLoad.error || 'no response'})`,
      eds: edsLoad.finalUrl,
      viewport,
    }));
  }
  [
    redirectFinding(liveLoad, 'live', config, viewport),
    redirectFinding(edsLoad, 'eds', config, viewport),
  ].filter(Boolean).forEach((item) => findings.push(item));
  return findings;
}

function isEdsUnavailable(edsLoad) {
  if (!edsLoad) return true;
  if (edsLoad.error) return true;
  if (edsLoad.status === 404 || edsLoad.status === 410) return true;
  return !edsLoad.ok;
}

function edsUnavailableMessage(edsLoad) {
  if (edsLoad.status === 404) return 'EDS page not found (404)';
  if (edsLoad.status === 410) return 'EDS page removed (410)';
  if (!edsLoad.ok && edsLoad.status) return `EDS page unavailable (HTTP ${edsLoad.status})`;
  if (edsLoad.error) return `EDS page unavailable (${edsLoad.error})`;
  return 'EDS page unavailable';
}

function compareContentRoots(live, eds, config, viewport = null) {
  const findings = [];
  if (!live.rootExists) {
    findings.push(finding({
      severity: 'ERROR',
      category: 'CONFIGURATION',
      code: 'LIVE_CONTENT_ROOT_MISSING',
      message: `WordPress content root was not found: ${config.contentRoots.live}`,
      live: config.contentRoots.live,
      viewport,
    }));
  }
  if (!eds.rootExists) {
    findings.push(finding({
      severity: 'ERROR',
      category: 'CONFIGURATION',
      code: 'EDS_CONTENT_ROOT_MISSING',
      message: `EDS content root was not found: ${config.contentRoots.eds}`,
      eds: config.contentRoots.eds,
      viewport,
    }));
  }
  return findings;
}

module.exports = {
  compareAvailability,
  compareContentRoots,
  edsUnavailableMessage,
  isEdsUnavailable,
  redirectFinding,
};
