const { finding } = require('./findings.js');
const { normalizeFilename, normalizeText, similarity } = require('./normalize.js');

function imageScore(live, eds) {
  let score = 0;
  const liveAlt = normalizeText(live.alt, { lowercase: true });
  const edsAlt = normalizeText(eds.alt, { lowercase: true });
  const liveContext = normalizeText(live.context, { lowercase: true });
  const edsContext = normalizeText(eds.context, { lowercase: true });
  if (liveAlt && liveAlt === edsAlt) score += 0.30;
  else if (liveAlt && edsAlt) score += similarity(liveAlt, edsAlt) * 0.15;
  if (liveContext && liveContext === edsContext) score += 0.60;
  const liveName = normalizeFilename(live.currentSrc || live.src);
  const edsName = normalizeFilename(eds.currentSrc || eds.src);
  if (liveName && edsName && liveName === edsName) score += 0.20;
  const liveRatio = live.width && live.height ? live.width / live.height : 0;
  const edsRatio = eds.width && eds.height ? eds.width / eds.height : 0;
  if (liveRatio && edsRatio && Math.abs(liveRatio - edsRatio) / liveRatio <= 0.12) score += 0.10;
  return score;
}

function normalizeAlt(value) {
  return normalizeText(value, { lowercase: true }).replace(/\s+graphic$/i, '');
}

function compareImages(liveImages, edsImages) {
  const findings = [];
  liveImages.filter((image) => !image.loaded).forEach((image) => findings.push(finding({
    severity: image.complete === false || image.decorative ? 'WARNING' : 'ERROR',
    category: 'IMAGES',
    code: image.complete === false ? 'LIVE_IMAGE_LOAD_INCOMPLETE' : 'BROKEN_LIVE_IMAGE',
    message: `Benchmark image ${image.complete === false ? 'did not finish loading' : 'did not load'}${image.context ? ` near "${image.context}"` : ''}`,
    live: image.src,
    context: image.context,
  })));
  edsImages.filter((image) => !image.loaded).forEach((image) => findings.push(finding({
    severity: image.complete === false || image.decorative ? 'WARNING' : 'ERROR',
    category: 'IMAGES',
    code: image.complete === false ? 'EDS_IMAGE_LOAD_INCOMPLETE' : 'BROKEN_EDS_IMAGE',
    message: `EDS image ${image.complete === false ? 'did not finish loading' : 'did not load'}${image.context ? ` near "${image.context}"` : ''}`,
    eds: image.src,
    context: image.context,
  })));

  const available = new Set(edsImages.map((image, index) => index));
  liveImages.forEach((liveImage) => {
    let best = null;
    edsImages.forEach((edsImage, index) => {
      if (!available.has(index)) return;
      const score = imageScore(liveImage, edsImage);
      if (!best || score > best.score) best = { index, image: edsImage, score };
    });
    if (best && best.score >= 0.45) {
      available.delete(best.index);
      if (normalizeAlt(liveImage.alt) !== normalizeAlt(best.image.alt)) {
        findings.push(finding({
          severity: liveImage.decorative ? 'INFO' : 'WARNING',
          category: 'IMAGES',
          code: 'IMAGE_ALT_CHANGED',
          message: `Image alt text differs${liveImage.context ? ` near "${liveImage.context}"` : ''}`,
          live: liveImage.alt,
          eds: best.image.alt,
          context: liveImage.context,
        }));
      }
      return;
    }
    findings.push(finding({
      severity: liveImage.decorative ? 'WARNING' : 'ERROR',
      category: 'IMAGES',
      code: 'MISSING_IMAGE',
      message: `No equivalent EDS image found${liveImage.context ? ` near "${liveImage.context}"` : ''}`,
      live: liveImage.src,
      context: liveImage.context,
    }));
  });
  [...available].forEach((index) => {
    const image = edsImages[index];
    findings.push(finding({
      severity: image.decorative ? 'INFO' : 'WARNING',
      category: 'IMAGES',
      code: 'UNEXPECTED_IMAGE',
      message: `Additional EDS image${image.context ? ` near "${image.context}"` : ''}`,
      eds: image.src,
      context: image.context,
    }));
  });
  return findings;
}

module.exports = { compareImages, imageScore };
