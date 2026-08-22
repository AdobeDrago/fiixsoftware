function normalizeWhitespace(value = '') {
  return String(value)
    .replace(/[\u00a0\u2007\u202f]/g, ' ')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTypography(value = '') {
  return normalizeWhitespace(value.normalize('NFKC'))
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201c\u201d\u2033]/g, '"')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\u2026/g, '...');
}

function normalizeText(value = '', options = {}) {
  const { ignoreTerminalPunctuation = true, lowercase = false } = options;
  let normalized = normalizeTypography(value);
  if (ignoreTerminalPunctuation) normalized = normalized.replace(/[.!?]+$/g, '');
  return lowercase ? normalized.toLocaleLowerCase('en-US') : normalized;
}

function normalizeFilename(value = '') {
  const clean = String(value).split(/[?#]/)[0];
  const filename = clean.substring(clean.lastIndexOf('/') + 1);
  return filename
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/(?:[-_](?:\d+x\d+|scaled|optimized|small|medium|large|thumb|thumbnail))+$/i, '')
    .replace(/^media_[a-f0-9]{20,}$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
    .toLocaleLowerCase('en-US');
}

function similarity(left, right) {
  const a = normalizeText(left, { lowercase: true });
  const b = normalizeText(right, { lowercase: true });
  if (a === b) return 1;
  if (!a || !b) return 0;
  const pairs = (text) => {
    if (text.length < 2) return [text];
    return Array.from({ length: text.length - 1 }, (_, index) => text.slice(index, index + 2));
  };
  const aPairs = pairs(a);
  const bPairs = pairs(b);
  const counts = new Map();
  bPairs.forEach((pair) => counts.set(pair, (counts.get(pair) || 0) + 1));
  let overlap = 0;
  aPairs.forEach((pair) => {
    const count = counts.get(pair) || 0;
    if (count > 0) {
      overlap += 1;
      counts.set(pair, count - 1);
    }
  });
  return (2 * overlap) / (aPairs.length + bPairs.length);
}

module.exports = {
  normalizeFilename,
  normalizeText,
  normalizeTypography,
  normalizeWhitespace,
  similarity,
};
