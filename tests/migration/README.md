# Migration validation

This Playwright suite compares the current public WordPress pages with their AEM Edge Delivery Services equivalents. WordPress is read at test time and remains the benchmark, so the suite detects both initial migration gaps and later source-site changes without maintaining copied content baselines.

The checks are read-only. They do not submit forms, create accounts, or trigger business workflows.

## Setup and commands

Install the project dependencies and the Chromium binary once:

```sh
npm install
npx playwright install chromium
```

Run all migration checks:

```sh
npm run test:migration
```

Open the most recent HTML report:

```sh
npm run test:migration:report
```

Use Playwright's `--grep` option for a focused run:

```sh
npm run test:migration -- --grep "Resource Center Ebook"
```

Every configured page also carries a page-family tag. Run one family with:

```sh
npm run test:migration -- --grep "@case-studies"
npm run test:migration -- --grep "@blog"
npm run test:migration -- --grep "@product"
npm run test:migration -- --grep "@reviews"
npm run test:migration -- --grep "@indexes"
```

Set `MIGRATION_WORKERS` to change the default concurrency of two fully parallel workers. Keep concurrency low to avoid unnecessary load on either public site.

## Adding a page

The suite contains 67 explicit mappings: 6 product pages, 1 reviews page, 4 index pages,
31 case studies, and 25 blog posts. Add static family entries in
`config/page-families.js`; `config/pages.js` turns them into complete page configurations.
Test logic is generated from the configuration, so no spec duplication is required.

```js
const productPages = [
  // Display name, shared path on the WordPress and EDS hosts.
  ['Example Page', '/example'],
];
```

Use exclusions only for content that is genuinely dynamic or implementation-specific. Do not exclude meaningful content simply to make a migration mismatch pass.
If a page genuinely needs different masks or thresholds, add a documented override when
building that entry in `config/pages.js`.

## What is compared

- Semantic content: headings, paragraphs, lists, labels, captions, buttons, cards, and order.
- Links: visible content and global links, CTA destinations, redirects, and response health.
- Images: load state, source variants, alt text, context, dimensions, aspect ratio, and order.
- Metadata: title, description, canonical, Open Graph, and present Twitter fields.
- Responsive behavior: mobile, tablet, and desktop visibility, overflow, navigation affordances, images, and major alignment drift.
- Visual fidelity: stabilized full-page WordPress, EDS, and pixel-diff screenshots.

Primary comparisons are scoped to the configured content roots so WordPress and EDS header/footer implementation details do not swamp the report. Global links are still recorded at a lower default severity. Full-page screenshots include the complete user experience after dynamic overlays are hidden.

## URL normalization

Configured Fiix, AEM preview, and AEM live hosts are treated as the same internal site. The normalizer also handles absolute versus relative URLs, trailing slashes, query-parameter ordering, and optional hashes.

Known tracking parameters (`utm_*`, `_gl`, `gclid`, `fbclid`, and `msclkid`) are ignored. All other query parameters are preserved because they may change the destination's meaning.

Link health checks use low concurrency and cache duplicate destinations. HTTP 404 and 410 responses are errors. Authentication, rate limiting, timeouts, and transient server errors are warnings because the destination cannot be reliably classified as broken.

## Visual testing

Artifacts use this structure:

```text
test-results/migration/<page>/<viewport>/
  live.png
  eds.png
  diff.png
```

The suite waits for fonts, images, and stable page height; disables motion; blocks analytics/chat requests; and hides configured consent or third-party overlays. The default color-distance threshold is `0.15`. A changed-pixel ratio above 2% is a warning and above 20% is an error. Page entries can override thresholds and masks when there is a documented reason.

The HTML report is written to `playwright-report/migration/`. Machine-readable and text summaries are written to `test-results/migration/summary.json` and `summary.txt`.
Each structured result includes its page type. A complete 67-page run produces 67
semantic results, 201 viewport results, and 603 live/EDS/diff PNG artifacts.

## Understanding results

- `ERROR`: meaningful migration issue, such as unavailable EDS content, missing copy, changed CTA, broken link, missing metadata, major responsive loss, or a major visual difference. Errors make the command fail.
- `WARNING`: requires review but may be an accepted implementation difference, such as heading-level drift, uncertain image equivalence, inaccessible third-party link, or a moderate visual difference.
- `INFO`: expected or harmless difference, such as equivalent internal hosts, an extra global link, or a visual difference below the warning threshold.

The suite accumulates all findings before asserting, so a failure includes a useful category summary instead of stopping at the first mismatch. If a page is unavailable, semantic comparison is skipped to prevent a cascade of misleading failures; responsive runs still attach live and EDS screenshots.

## Scaling the suite

Onboard additional migrated pages incrementally. Review each page's first report, add only justified masks or content-root overrides, and keep the benchmark/source rules centralized. The configuration tests require the static Case Study and Blog manifests to match their repository listing snapshots, preventing those families from silently losing coverage. Repeated link destinations are cached within a run, so adding pages does not repeatedly health-check shared navigation destinations.
