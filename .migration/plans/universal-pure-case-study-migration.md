There is no existing "case study" template. Let me check the project config and whether a case-studies page exists.# Migrate Case Study Page — Universal Pure

**Source URL:** `https://fiixsoftware.com/resource-center/case-studies/universal-pure/`

## Overview

This is a **new page type** for the site. The existing migration catalog (`tools/importer/page-templates.json`) covers home, enterprise, pricing, product-feature, contact-us, premium-support, training, and marketing-landing pages — but there is **no case-study template yet**. So this migration will scrape the page, analyze its structure, reuse existing blocks where possible (and create/style new variants where needed), generate import infrastructure, run the import, and verify the rendered result.

> **Note:** Execution requires **Execute mode**. This artifact is the plan; switching to Execute mode will run the steps below.

## Available blocks to reuse

The project already has a rich block palette that should cover most of a case-study layout:
`hero`, `hero-cta`, `hero-lead`, `columns-media`, `columns-callout`, `columns-logos`, `cards`, `cards-icon`, `cards-features`, `carousel-testimonial`, `table-compare`, `accordion-faq`, `promo-bar`, plus `header`/`footer`.

Case studies typically need: a hero (customer + headline), a challenge/solution/results narrative (columns-media or default content), a metrics/stats band (cards-icon or a new stats variant), a customer quote (carousel-testimonial), and a closing CTA.

## Checklist

- [ ] **Scrape the source page** — fetch `universal-pure/`, extract metadata, download images, produce cleaned HTML and analysis JSON (excat-page-analysis / scrape-webpage skill)
- [ ] **Identify page structure** — determine section boundaries and content sequences; classify default content vs blocks
- [ ] **Survey block inventory & map** — match each section to an existing block; flag any sequence needing a new block variant (case-study-specific hero, stats band, quote treatment)
- [ ] **Create/style new block variants** if the analysis surfaces layouts not covered by existing blocks; extract computed styles from the source for visual fidelity
- [ ] **Create a `case-study-page` template** in `page-templates.json` with the source URL and block mappings; add `urls-case-study-page.txt`
- [ ] **Generate import infrastructure** — block parsers and page transformers for the new/updated blocks (excat-import-infrastructure)
- [ ] **Generate & bundle the import script** for the case-study template (uses the bundled import script + `run-bulk-import.js`)
- [ ] **Run the content import** to produce the HTML content page (via the bundled import script — no hand-authored HTML)
- [ ] **Preview & verify** the rendered page against the original; check hero, narrative sections, stats, quote, images, and CTA
- [ ] **Visual critique & fix** — compare migrated page to the source and correct styling/layout discrepancies
- [ ] **Lint** (`npm run lint`) and confirm the page renders cleanly in preview
- [ ] **Publish / next steps** — confirm with you before uploading to the content source and (optionally) opening a PR for any new block code

## Open questions

None blocking — this can proceed as a single-page migration establishing a new "case study" page type. If you'd prefer to treat this as the first of *several* case studies (so the template is built for reuse across the whole `case-studies/` section), let me know and I'll broaden the template scope.

Switch to **Execute mode** and I'll start with the scrape and structure analysis.
