const { finding } = require('./findings.js');
const { normalizeText } = require('./normalize.js');

function compareResponsive(live, eds, viewport, viewportSize) {
  const findings = [];
  if (eds.layout.horizontalOverflow > 2) {
    findings.push(finding({
      severity: 'ERROR',
      category: 'RESPONSIVE',
      code: 'HORIZONTAL_OVERFLOW',
      message: `EDS overflows horizontally by ${eds.layout.horizontalOverflow}px`,
      eds: eds.layout.horizontalOverflow,
      viewport,
    }));
  }
  if (live.layout.horizontalOverflow > 2) {
    findings.push(finding({
      severity: 'INFO',
      category: 'RESPONSIVE',
      code: 'BENCHMARK_HORIZONTAL_OVERFLOW',
      message: `WordPress benchmark overflows horizontally by ${live.layout.horizontalOverflow}px`,
      live: live.layout.horizontalOverflow,
      viewport,
    }));
  }
  const liveHasNavigation = live.layout.visibleNavigation > 0 || live.layout.menuAffordances > 0;
  const edsHasNavigation = eds.layout.visibleNavigation > 0 || eds.layout.menuAffordances > 0;
  if (liveHasNavigation && !edsHasNavigation) {
    findings.push(finding({
      severity: 'ERROR',
      category: 'RESPONSIVE',
      code: 'MISSING_NAVIGATION_AFFORDANCE',
      message: 'EDS has no visible navigation or menu affordance',
      viewport,
    }));
  }

  const edsTexts = new Set(eds.content.map((item) => (
    normalizeText(item.text, { lowercase: true })
  )));
  const missingVisible = live.content.filter((item) => (
    !edsTexts.has(normalizeText(item.text, { lowercase: true }))
  ));
  const missingRatio = live.content.length ? missingVisible.length / live.content.length : 0;
  if (missingRatio >= 0.25) {
    findings.push(finding({
      severity: 'ERROR',
      category: 'RESPONSIVE',
      code: 'MAJOR_VISIBLE_CONTENT_GAP',
      message: `${missingVisible.length} of ${live.content.length} benchmark content items are not visible in EDS`,
      live: missingVisible.slice(0, 20).map((item) => item.text),
      viewport,
    }));
  } else if (missingVisible.length) {
    findings.push(finding({
      severity: 'WARNING',
      category: 'RESPONSIVE',
      code: 'VISIBLE_CONTENT_GAP',
      message: `${missingVisible.length} benchmark content item(s) are not visible in EDS`,
      live: missingVisible.slice(0, 20).map((item) => item.text),
      viewport,
    }));
  }

  const edsByText = new Map(eds.content.map((item) => [
    normalizeText(item.text, { lowercase: true }), item,
  ]));
  const common = live.content.filter((item) => (
    edsByText.has(normalizeText(item.text, { lowercase: true }))
  ));
  const widthDrift = common.filter((item) => {
    const target = edsByText.get(normalizeText(item.text, { lowercase: true }));
    if (!item.rect.width || !target.rect.width) return false;
    return Math.abs(item.rect.width - target.rect.width) / viewportSize.width > 0.35;
  });
  if (widthDrift.length >= Math.max(3, Math.ceil(common.length * 0.2))) {
    findings.push(finding({
      severity: 'WARNING',
      category: 'RESPONSIVE',
      code: 'MAJOR_ALIGNMENT_DRIFT',
      message: `${widthDrift.length} shared content items differ substantially in width/alignment`,
      context: widthDrift.slice(0, 10).map((item) => item.text),
      viewport,
    }));
  }
  const liveMeaningfulImages = live.images.filter((image) => !image.decorative).length;
  const edsMeaningfulImages = eds.images.filter((image) => !image.decorative).length;
  if (liveMeaningfulImages >= 3 && edsMeaningfulImages / liveMeaningfulImages < 0.7) {
    findings.push(finding({
      severity: 'ERROR',
      category: 'RESPONSIVE',
      code: 'RESPONSIVE_IMAGES_MISSING',
      message: `Only ${edsMeaningfulImages} of ${liveMeaningfulImages} benchmark images are visible in EDS`,
      live: liveMeaningfulImages,
      eds: edsMeaningfulImages,
      viewport,
    }));
  }
  return findings;
}

module.exports = { compareResponsive };
