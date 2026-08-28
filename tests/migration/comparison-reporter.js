const fs = require('fs');
const os = require('os');
const path = require('path');
const { writeComparisonReport } = require('./utils/comparison-report-html.js');

class ComparisonReporter {
  constructor() {
    this.results = [];
    this.outputDirectory = path.resolve('comparison-report');
    this.stagingDirectory = null;
    this.meta = null;
  }

  onBegin() {
    fs.rmSync(this.outputDirectory, { recursive: true, force: true });
    fs.mkdirSync(this.outputDirectory, { recursive: true });
    this.stagingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'fiix-comparison-report-'));
  }

  stageImages(result) {
    const pageDirectory = path.join(this.outputDirectory, 'pages', result.slug);
    fs.mkdirSync(pageDirectory, { recursive: true });
    const imageMap = {};
    Object.entries(result.sourceImages || {}).forEach(([key, sourcePath]) => {
      if (!sourcePath || !fs.existsSync(sourcePath)) return;
      const targetPath = path.join(pageDirectory, `${key}.png`);
      fs.copyFileSync(sourcePath, targetPath);
      imageMap[key] = path.relative(this.outputDirectory, targetPath).split(path.sep).join('/');
    });
    return imageMap;
  }

  onTestEnd(test, testResult) {
    const attachment = testResult.attachments.find((item) => item.name === 'comparison-result');
    if (!attachment?.body) return;
    try {
      const result = JSON.parse(attachment.body.toString('utf8'));
      result.images = this.stageImages(result);
      this.results.push(result);
      if (!this.meta && result.meta) this.meta = result.meta;
      process.stdout.write(`\nComparison: ${result.page} — visual ${((result.visual?.ratio || 0) * 100).toFixed(2)}%\n`);
    } catch (error) {
      process.stderr.write(`Unable to parse comparison result for ${test.title}: ${error.message}\n`);
    }
  }

  onEnd() {
    if (!this.results.length) {
      process.stdout.write('\nComparison report: no page results collected.\n');
      return;
    }
    const meta = this.meta || {
      generatedAt: new Date().toISOString(),
      edsOrigin: 'unknown',
      viewport: 'desktop',
    };
    const { htmlPath, jsonPath } = writeComparisonReport(
      this.outputDirectory,
      meta,
      this.results,
    );
    fs.rmSync(this.stagingDirectory, { recursive: true, force: true });
    process.stdout.write(`\nComparison report: ${this.results.length} page(s)\n`);
    process.stdout.write(`HTML: ${htmlPath}\n`);
    process.stdout.write(`JSON: ${jsonPath}\n`);
  }
}

module.exports = ComparisonReporter;
