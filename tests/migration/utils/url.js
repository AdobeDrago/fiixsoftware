function shouldIgnoreParameter(name, patterns = []) {
  return patterns.some((pattern) => {
    if (pattern instanceof RegExp) return pattern.test(name);
    return pattern === name;
  });
}

function normalizeUrl(value, baseUrl, options = {}) {
  if (!value) return null;
  if (/^(?:mailto|tel|javascript):/i.test(value)) return value.trim();
  let parsed;
  try {
    parsed = new URL(value, baseUrl);
  } catch (error) {
    return String(value).trim();
  }

  parsed.hostname = parsed.hostname.toLocaleLowerCase('en-US');
  parsed.protocol = parsed.protocol.toLocaleLowerCase('en-US');
  const hostIsEquivalent = (options.equivalentHosts || []).includes(parsed.hostname);
  const host = hostIsEquivalent ? '{site}' : parsed.host;
  let pathname = parsed.pathname.replace(/\/{2,}/g, '/');
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');
  const parameters = [...parsed.searchParams.entries()]
    .filter(([name]) => !shouldIgnoreParameter(name, options.ignoredQueryParameters))
    .sort(([leftName, leftValue], [rightName, rightValue]) => {
      const nameOrder = leftName.localeCompare(rightName);
      return nameOrder || leftValue.localeCompare(rightValue);
    });
  const search = parameters.length
    ? `?${parameters.map(([name, valueItem]) => `${encodeURIComponent(name)}=${encodeURIComponent(valueItem)}`).join('&')}`
    : '';
  const hash = options.preserveHashes ? parsed.hash : '';
  return `${host}${pathname}${search}${hash}`;
}

function urlsEquivalent(left, right, leftBase, rightBase, options = {}) {
  return normalizeUrl(left, leftBase, options) === normalizeUrl(right, rightBase, options);
}

function isCheckableUrl(value) {
  return /^https?:\/\//i.test(value || '');
}

module.exports = { isCheckableUrl, normalizeUrl, urlsEquivalent };
