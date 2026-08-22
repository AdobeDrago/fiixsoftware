const fs = require('fs');
const os = require('os');
const path = require('path');
const { formatResult, formatResultStatus } = require('./utils/reporting.js');

class MigrationReporter {
  constructor() {
    this.results = [];
    this.outputDirectory = path.resolve('test-results', 'migration');
    this.active = false;
    this.artifactCopies = [];
    this.stagingDirectory = null;
  }

  onBegin(config, suite) {
    this.active = suite.allTests().some((test) => !test.location.file.includes('/unit/'));
    if (!this.active) return;
    fs.rmSync(this.outputDirectory, { recursive: true, force: true });
    fs.mkdirSync(this.outputDirectory, { recursive: true });
    this.stagingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'fiix-migration-artifacts-'));
  }

  stageArtifacts(testResult, result) {
    result.artifacts.forEach((target) => {
      const artifactType = path.basename(target, path.extname(target));
      const source = testResult.attachments.find((attachment) => (
        attachment.contentType === 'image/png'
        && attachment.path
        && (attachment.name.endsWith(`-${artifactType}`)
          || path.basename(attachment.path).includes(`-${artifactType}-`))
      ));
      if (!source || !fs.existsSync(source.path)) {
        process.stderr.write(`Unable to stage migration artifact: ${target}\n`);
        return;
      }
      const staged = path.join(
        this.stagingDirectory,
        `${this.artifactCopies.length}-${path.basename(target)}`,
      );
      fs.copyFileSync(source.path, staged);
      this.artifactCopies.push({ staged, target });
    });
  }

  onTestEnd(test, testResult) {
    const attachment = testResult.attachments.find((item) => item.name === 'migration-result');
    if (!attachment?.body) return;
    try {
      const result = JSON.parse(attachment.body.toString('utf8'));
      this.results.push(result);
      this.stageArtifacts(testResult, result);
      process.stdout.write(`\nMigration: ${formatResultStatus(result)}\n`);
    } catch (error) {
      process.stderr.write(`Unable to parse migration result for ${test.title}: ${error.message}\n`);
    }
  }

  onEnd() {
    if (!this.active) return;
    try {
      this.artifactCopies.forEach(({ staged, target }) => {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(staged, target);
      });
      fs.mkdirSync(this.outputDirectory, { recursive: true });
      const summaryPath = path.join(this.outputDirectory, 'summary.json');
      const textPath = path.join(this.outputDirectory, 'summary.txt');
      fs.writeFileSync(summaryPath, `${JSON.stringify({
        generatedAt: new Date().toISOString(),
        results: this.results,
      }, null, 2)}\n`);
      fs.writeFileSync(textPath, `${this.results.map(formatResult).join('\n\n')}\n`);
      const failingResults = this.results.filter(({ findings }) => (
        findings.some(({ severity }) => severity === 'ERROR')
      )).length;
      process.stdout.write(
        `\nMigration report: ${this.results.length} result(s), ${failingResults} with errors.\n`,
      );
    } finally {
      fs.rmSync(this.stagingDirectory, { recursive: true, force: true });
    }
  }
}

module.exports = MigrationReporter;
