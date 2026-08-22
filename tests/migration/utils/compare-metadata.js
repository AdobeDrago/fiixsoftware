const { finding } = require('./findings.js');
const { normalizeText, normalizeTypography, similarity } = require('./normalize.js');
const { urlsEquivalent } = require('./url.js');

const TEXT_FIELDS = [
  ['title', 'title'],
  ['description', 'meta description'],
  ['ogTitle', 'og:title'],
  ['ogDescription', 'og:description'],
  ['twitterCard', 'twitter:card'],
  ['twitterTitle', 'twitter:title'],
  ['twitterDescription', 'twitter:description'],
];

const URL_FIELDS = [
  ['canonical', 'canonical URL'],
  ['ogUrl', 'og:url'],
];

function compareMetadata(live, eds, config) {
  const findings = [];
  TEXT_FIELDS.forEach(([key, label]) => {
    if (!live[key] && !eds[key]) return;
    if (live[key] && !eds[key]) {
      findings.push(finding({
        severity: 'ERROR',
        category: 'METADATA',
        code: 'MISSING_METADATA',
        message: `Missing ${label} in EDS`,
        live: live[key],
      }));
      return;
    }
    if (!live[key] && eds[key]) {
      findings.push(finding({
        severity: 'INFO',
        category: 'METADATA',
        code: 'ADDITIONAL_METADATA',
        message: `EDS adds ${label}`,
        eds: eds[key],
      }));
      return;
    }
    if (normalizeTypography(live[key]) === normalizeTypography(eds[key])) return;
    const punctuationOnly = normalizeText(live[key]) === normalizeText(eds[key]);
    findings.push(finding({
      severity: punctuationOnly ? 'WARNING' : 'ERROR',
      category: 'METADATA',
      code: punctuationOnly ? 'METADATA_PUNCTUATION_CHANGED' : 'CHANGED_METADATA',
      message: `${label} differs${punctuationOnly ? ' only by terminal punctuation' : ''}`,
      live: live[key],
      eds: eds[key],
    }));
  });
  URL_FIELDS.forEach(([key, label]) => {
    if (!live[key] && !eds[key]) return;
    if (live[key] && !eds[key]) {
      findings.push(finding({
        severity: 'ERROR',
        category: 'METADATA',
        code: 'MISSING_URL_METADATA',
        message: `Missing ${label} in EDS`,
        live: live[key],
      }));
      return;
    }
    if (!urlsEquivalent(live[key], eds[key], config.live, config.eds, config)) {
      findings.push(finding({
        severity: 'ERROR',
        category: 'METADATA',
        code: 'CHANGED_URL_METADATA',
        message: `${label} points to a different destination`,
        live: live[key],
        eds: eds[key],
      }));
    } else if (live[key] !== eds[key]) {
      findings.push(finding({
        severity: 'INFO',
        category: 'METADATA',
        code: 'EXPECTED_URL_DOMAIN_CHANGE',
        message: `${label} differs only by an expected host/URL format`,
        live: live[key],
        eds: eds[key],
      }));
    }
  });

  [['ogImage', 'og:image'], ['twitterImage', 'twitter:image']].forEach(([key, label]) => {
    if (!live[key] && !eds[key]) return;
    if (live[key] && !eds[key]) {
      findings.push(finding({
        severity: 'ERROR',
        category: 'METADATA',
        code: 'MISSING_IMAGE_METADATA',
        message: `Missing ${label} in EDS`,
        live: live[key],
      }));
      return;
    }
    if (!live[key] && eds[key]) return;
    if (live[key] === eds[key]) return;
    findings.push(finding({
      severity: similarity(live[key], eds[key]) >= 0.65 ? 'INFO' : 'WARNING',
      category: 'METADATA',
      code: 'IMAGE_METADATA_CHANGED',
      message: `${label} uses a different asset URL; review visual equivalence`,
      live: live[key],
      eds: eds[key],
    }));
  });
  return findings;
}

module.exports = { compareMetadata };
