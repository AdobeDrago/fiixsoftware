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

function closestMatchIndex(links, availableIndexes, targetIndex, predicate) {
  let bestIndex = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  availableIndexes.forEach((index) => {
    if (!predicate(links[index])) return;
    const distance = Math.abs(targetIndex - index);
    if (distance < bestDistance) {
      bestIndex = index;
      bestDistance = distance;
    }
  });
  return bestIndex;
}

function compareLinks(liveLinks, edsLinks, config) {
  const findings = [];
  const remainingLive = new Set(liveLinks.map((link, index) => index));
  const remainingEds = new Set(edsLinks.map((link, index) => index));
  liveLinks.forEach((liveLink, liveIndex) => {
    const liveKey = linkKey(liveLink, config.live, config);
    const exactIndex = closestMatchIndex(
      edsLinks,
      remainingEds,
      liveIndex,
      (edsLink) => liveKey === linkKey(edsLink, config.eds, config),
    );
    if (exactIndex < 0) return;
    remainingLive.delete(liveIndex);
    remainingEds.delete(exactIndex);
  });

  [...remainingLive].forEach((liveIndex) => {
    const liveLink = liveLinks[liveIndex];
    const liveIdentity = identityKey(liveLink);
    const identityIndex = closestMatchIndex(
      edsLinks,
      remainingEds,
      liveIndex,
      (edsLink) => liveIdentity === identityKey(edsLink),
    );
    if (identityIndex >= 0) {
      const edsLink = edsLinks[identityIndex];
      remainingLive.delete(liveIndex);
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
    }
  });

  [...remainingLive].forEach((index) => {
    const link = liveLinks[index];
    findings.push(finding({
      severity: link.scope === 'content' ? 'ERROR' : 'WARNING',
      category: 'LINKS',
      code: 'MISSING_LINK',
      message: `Missing ${link.scope} link in EDS: "${link.label || link.href}"`,
      live: link.href,
      context: link.context,
    }));
  });
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

module.exports = {
  closestMatchIndex, compareLinks, identityKey, linkKey,
};
