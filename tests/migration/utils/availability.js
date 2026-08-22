const { finding } = require('./findings.js');

function compareAvailability(liveLoad, edsLoad, viewport = null) {
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
  return findings;
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

module.exports = { compareAvailability, compareContentRoots };
