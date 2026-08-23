const { finding } = require('./findings.js');
const { normalizeText, similarity } = require('./normalize.js');

const CONTENT_FUZZY_THRESHOLD = 0.58;

function contentKey(item) {
  return `${item.kind}:${normalizeText(item.text, { lowercase: true })}`;
}

function exactMatches(liveItems, edsItems) {
  const unusedEds = new Set(edsItems.map((item, index) => index));
  const matches = [];
  const unmatchedLiveIndexes = new Set(liveItems.map((item, index) => index));
  const contextKey = (item) => normalizeText(item.context, { lowercase: true });

  function matchPass(requireMatchingContext) {
    liveItems.forEach((liveItem, liveIndex) => {
      if (!unmatchedLiveIndexes.has(liveIndex)) return;
      let bestIndex = -1;
      let bestDistance = Number.POSITIVE_INFINITY;
      unusedEds.forEach((edsIndex) => {
        const edsItem = edsItems[edsIndex];
        if (contentKey(liveItem) !== contentKey(edsItem)) return;
        if (requireMatchingContext && contextKey(liveItem) !== contextKey(edsItem)) return;
        const distance = Math.abs(liveIndex - edsIndex);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = edsIndex;
        }
      });
      if (bestIndex < 0) return;
      unusedEds.delete(bestIndex);
      unmatchedLiveIndexes.delete(liveIndex);
      matches.push({
        live: liveItem, eds: edsItems[bestIndex], liveIndex, edsIndex: bestIndex,
      });
    });
  }

  matchPass(true);
  matchPass(false);
  const unmatchedLive = [...unmatchedLiveIndexes]
    .map((index) => ({ item: liveItems[index], index }));
  const unmatchedEds = [...unusedEds].map((index) => ({ item: edsItems[index], index }));
  return { matches, unmatchedLive, unmatchedEds };
}

function fuzzyMatches(unmatchedLive, unmatchedEds) {
  const remainingEds = new Set(unmatchedEds.map((item) => item.index));
  const changes = [];
  const missing = [];
  unmatchedLive.forEach((candidate) => {
    let best = null;
    unmatchedEds.forEach((edsCandidate) => {
      if (!remainingEds.has(edsCandidate.index)) return;
      if (candidate.item.kind !== edsCandidate.item.kind) return;
      const score = similarity(candidate.item.text, edsCandidate.item.text);
      const distance = Math.abs(candidate.index - edsCandidate.index);
      if (!best || score > best.score || (score === best.score && distance < best.distance)) {
        best = { candidate: edsCandidate, score, distance };
      }
    });
    if (best && best.score >= CONTENT_FUZZY_THRESHOLD) {
      remainingEds.delete(best.candidate.index);
      changes.push({ live: candidate, eds: best.candidate, score: best.score });
    } else {
      missing.push(candidate);
    }
  });
  const unexpected = unmatchedEds.filter((item) => remainingEds.has(item.index));
  return { changes, missing, unexpected };
}

function compareContent(liveItems, edsItems, viewport = null) {
  const findings = [];
  const exact = exactMatches(liveItems, edsItems);
  const fuzzy = fuzzyMatches(exact.unmatchedLive, exact.unmatchedEds);

  fuzzy.missing.forEach(({ item }) => findings.push(finding({
    severity: 'ERROR',
    category: 'CONTENT',
    code: 'MISSING_CONTENT',
    message: `Missing ${item.kind} in EDS: "${item.text}"`,
    live: item.text,
    context: item.context,
    viewport,
  })));
  fuzzy.unexpected.forEach(({ item }) => findings.push(finding({
    severity: 'ERROR',
    category: 'CONTENT',
    code: 'UNEXPECTED_CONTENT',
    message: `Unexpected ${item.kind} in EDS: "${item.text}"`,
    eds: item.text,
    context: item.context,
    viewport,
  })));
  fuzzy.changes.forEach(({ live, eds, score }) => findings.push(finding({
    severity: 'ERROR',
    category: 'CONTENT',
    code: 'CHANGED_CONTENT',
    message: `Changed ${live.item.kind} (${Math.round(score * 100)}% similar)`,
    live: live.item.text,
    eds: eds.item.text,
    context: live.item.context || eds.item.context,
    viewport,
  })));

  const headingLevelChanges = exact.matches.filter(({ live, eds }) => (
    live.kind === 'heading' && live.tag !== eds.tag
  ));
  if (headingLevelChanges.length) {
    findings.push(finding({
      severity: 'WARNING',
      category: 'CONTENT',
      code: 'HEADING_LEVELS_CHANGED',
      message: `${headingLevelChanges.length} matching headings use different levels`,
      live: headingLevelChanges.map(({ live }) => `${live.tag}: ${live.text}`),
      eds: headingLevelChanges.map(({ eds }) => `${eds.tag}: ${eds.text}`),
      viewport,
    }));
  }

  const orderedMatches = exact.matches
    .sort((left, right) => left.liveIndex - right.liveIndex)
    .map(({ edsIndex }) => edsIndex);
  const outOfOrder = orderedMatches.reduce((count, index, position) => {
    if (position === 0) return count;
    return count + (index < orderedMatches[position - 1] ? 1 : 0);
  }, 0);
  if (outOfOrder) {
    findings.push(finding({
      severity: 'WARNING',
      category: 'CONTENT',
      code: 'CONTENT_ORDER_CHANGED',
      message: `${outOfOrder} semantic content sequence(s) appear in a different order`,
      viewport,
    }));
  }
  return findings;
}

module.exports = { compareContent, CONTENT_FUZZY_THRESHOLD };
