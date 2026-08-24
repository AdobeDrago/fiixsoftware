const DEFAULT_EDS_ORIGIN = 'https://develop--fiixsoftware--adobedrago.aem.page';

function resolveEdsOrigin(value = process.env.MIGRATION_EDS_ORIGIN) {
  const supplied = value === undefined ? '' : String(value).trim();
  const candidate = supplied || DEFAULT_EDS_ORIGIN;
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new TypeError(
      'MIGRATION_EDS_ORIGIN must be an absolute HTTP(S) origin without a path, query, or hash',
    );
  }
  const hasOriginShape = /^[a-z][a-z\d+.-]*:\/\/[^/?#]+\/?$/i.test(candidate);
  const hasUnsupportedParts = !hasOriginShape
    || !['http:', 'https:'].includes(parsed.protocol)
    || parsed.username
    || parsed.password
    || !['', '/'].includes(parsed.pathname)
    || parsed.search
    || parsed.hash;
  if (hasUnsupportedParts) {
    throw new TypeError(
      'MIGRATION_EDS_ORIGIN must be an absolute HTTP(S) origin without a path, query, or hash',
    );
  }
  return parsed.origin;
}

module.exports = { DEFAULT_EDS_ORIGIN, resolveEdsOrigin };
