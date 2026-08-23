const fs = require('fs');
const path = require('path');
const pixelmatch = require('pixelmatch');
const { PNG } = require('pngjs');
const { finding } = require('./findings.js');

function whiteCanvas(width, height) {
  const image = new PNG({ width, height });
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = 255;
    image.data[index + 1] = 255;
    image.data[index + 2] = 255;
    image.data[index + 3] = 255;
  }
  return image;
}

function padImage(image, width, height) {
  const canvas = whiteCanvas(width, height);
  PNG.bitblt(image, canvas, 0, 0, image.width, image.height, 0, 0);
  return canvas;
}

async function capturePair(livePage, edsPage, pageConfig, viewportName) {
  const artifactDirectory = path.resolve(
    'test-results',
    'migration',
    pageConfig.slug,
    viewportName,
  );
  fs.mkdirSync(artifactDirectory, { recursive: true });
  const livePath = path.join(artifactDirectory, 'live.png');
  const edsPath = path.join(artifactDirectory, 'eds.png');
  const diffPath = path.join(artifactDirectory, 'diff.png');
  await Promise.all([
    livePage.screenshot({ path: livePath, fullPage: true, animations: 'disabled' }),
    edsPage.screenshot({ path: edsPath, fullPage: true, animations: 'disabled' }),
  ]);
  return {
    artifactDirectory, livePath, edsPath, diffPath,
  };
}

function compareScreenshots(paths, thresholds, viewport) {
  const live = PNG.sync.read(fs.readFileSync(paths.livePath));
  const eds = PNG.sync.read(fs.readFileSync(paths.edsPath));
  const width = Math.max(live.width, eds.width);
  const height = Math.max(live.height, eds.height);
  const livePadded = padImage(live, width, height);
  const edsPadded = padImage(eds, width, height);
  const diff = whiteCanvas(width, height);
  pixelmatch(
    livePadded.data,
    edsPadded.data,
    diff.data,
    width,
    height,
    { threshold: thresholds.pixel, includeAA: false },
  );
  fs.writeFileSync(paths.diffPath, PNG.sync.write(diff));

  const overlapWidth = Math.min(live.width, eds.width);
  const overlapHeight = Math.min(live.height, eds.height);
  const liveOverlap = new PNG({ width: overlapWidth, height: overlapHeight });
  const edsOverlap = new PNG({ width: overlapWidth, height: overlapHeight });
  PNG.bitblt(live, liveOverlap, 0, 0, overlapWidth, overlapHeight, 0, 0);
  PNG.bitblt(eds, edsOverlap, 0, 0, overlapWidth, overlapHeight, 0, 0);
  const differentPixels = pixelmatch(
    liveOverlap.data,
    edsOverlap.data,
    null,
    overlapWidth,
    overlapHeight,
    { threshold: thresholds.pixel, includeAA: false },
  );
  const ratio = differentPixels / (overlapWidth * overlapHeight);
  let severity = 'INFO';
  if (ratio > thresholds.error) severity = 'ERROR';
  else if (ratio > thresholds.warning) severity = 'WARNING';
  const artifacts = [paths.livePath, paths.edsPath, paths.diffPath];
  const findings = [finding({
    severity,
    category: 'VISUAL',
    code: severity === 'INFO' ? 'VISUAL_WITHIN_TOLERANCE' : 'VISUAL_DIFFERENCE',
    message: `Visual difference in the shared page region is ${(ratio * 100).toFixed(2)}%`,
    live: `${live.width}x${live.height}`,
    eds: `${eds.width}x${eds.height}`,
    viewport,
    artifacts,
  })];
  const heightDifference = Math.abs(live.height - eds.height);
  const heightRatio = heightDifference / Math.max(live.height, eds.height);
  if (heightDifference > 2) {
    let heightSeverity = 'INFO';
    if (heightRatio > thresholds.error) heightSeverity = 'ERROR';
    else if (heightRatio > thresholds.warning) heightSeverity = 'WARNING';
    findings.push(finding({
      severity: heightSeverity,
      category: 'VISUAL',
      code: 'PAGE_HEIGHT_DIFFERENCE',
      message: `Page height differs by ${heightDifference}px (${(heightRatio * 100).toFixed(2)}%)`,
      live: `${live.width}x${live.height}`,
      eds: `${eds.width}x${eds.height}`,
      viewport,
      artifacts,
    }));
  }
  return {
    ratio,
    heightRatio,
    findings,
  };
}

module.exports = { capturePair, compareScreenshots, padImage };
