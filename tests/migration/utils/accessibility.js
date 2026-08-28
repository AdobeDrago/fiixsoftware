const { AxeBuilder } = require('@axe-core/playwright');
const { summarizeAxeResults } = require('./lighthouse-accessibility.js');

async function collectAccessibility(page) {
  const results = await new AxeBuilder({ page }).analyze();
  return summarizeAxeResults(results);
}

module.exports = { collectAccessibility, summarizeAxeResults };
