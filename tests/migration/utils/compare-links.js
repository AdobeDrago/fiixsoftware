const { finding } = require('./findings.js');
const { normalizeText } = require('./normalize.js');
const { normalizeUrl } = require('./url.js');

function linkKey(link, baseUrl, config) {
  const label = normalizeText(link.label, { lowercase: true });
  const context = normalizeText(link.context, { lowercase: true });
  return `${link.scope}:${context}:${label}:${normalizeUrl(link.href, baseUrl, config)}`;
}

function identityKey(link) {
  const label = normalizeText(link.label, { lowercase: true });
  const context = normalizeText(link.context, { lowercase: true });
  return `${link.scope}:${context}:${label}`;
}

function compareLinks(liveLinks, edsLinks, config) {
  const findings = [];
  const remainingEds = new Set(edsLinks.map((link, index) => index));
  const missing = [];
  liveLinks.forEach((liveLink) => {
    const exactIndex = edsLinks.findIndex((edsLink, index) => (
      remainingEds.has(index)
      && linkKey(liveLink, config.live, config) === linkKey(edsLink, config.eds, config)
    ));
    if (exactIndex >= 0) {
      remainingEds.delete(exactIndex);
      return;
    }
    const identityIndex = edsLinks.findIndex((edsLink, index) => (
      remainingEds.has(index) && identityKey(liveLink) === identityKey(edsLink)
    ));
    if (identityIndex >= 0) {
      const edsLink = edsLinks[identityIndex];
      remainingEds.delete(identityIndex);
      findings.push(finding({
        severity: liveLink.scope === 'content' ? 'ERROR' : 'WARNING',
        category: 'LINKS',
        code: 'LINK_DESTINATION_CHANGED',
        message: `Destination changed for "${liveLink.label || '(unlabelled link)'}"`,
        live: liveLink.href,
        eds: edsLink.href,
        context: liveLink.context,
      }));
      return;
    }
    missing.push(liveLink);
  });

  missing.forEach((link) => findings.push(finding({
    severity: link.scope === 'content' ? 'ERROR' : 'WARNING',
    category: 'LINKS',
    code: 'MISSING_LINK',
    message: `Missing ${link.scope} link in EDS: "${link.label || link.href}"`,
    live: link.href,
    context: link.context,
  })));
  [...remainingEds].forEach((index) => {
    const link = edsLinks[index];
    findings.push(finding({
      severity: link.scope === 'content' ? 'WARNING' : 'INFO',
      category: 'LINKS',
      code: 'UNEXPECTED_LINK',
      message: `Additional ${link.scope} link in EDS: "${link.label || link.href}"`,
      eds: link.href,
      context: link.context,
    }));
  });
  return findings;
}

module.exports = { compareLinks, identityKey, linkKey };
