# Migrate Case Study Pages — DLG Group & Farming Maintenance

**Reference migration:** `universal-pure` (already live on EDS)
**Source URLs:**
- `https://fiixsoftware.com/resource-center/case-studies/dlg-group/`
- `https://fiixsoftware.com/resource-center/case-studies/farming-maintenance/`

> Execution requires **Execute mode**. This artifact is the plan.

## Approach

Reuse the existing `case-study-page` migration infrastructure built for Universal Pure rather than inventing anything new:
- **Template:** `case-study-page` in `tools/importer/page-templates.json` (mirrored inline in `import-case-study-page.js`)
- **Parsers:** `hero-case-study.js`, `columns-media.js` (its `.ba-fiix` branch), `hero-cta.js`
- **Transformers:** `fiix-cleanup.js`, `fiix-sections.js`
- **Blocks/CSS:** `hero-case-study`, `columns-media`, `hero-cta` (already styled to match the live design)

Both URLs get added to `urls-case-study-page.txt` and the template's `urls[]`, then run through the same bundled import script. Parsers already branch on DOM, so DLG should flow through cleanly; farming-maintenance's deviations are handled by extending the parser branches (or a small variant) rather than hand-authoring HTML.

## Known structural differences (from live-page inspection)

**DLG Group** — near-identical to Universal Pure:
- Hero: H1 "DLG Group" + H2 headline + back link; customer logo present.
- No headshot / person name / quote block, no embedded video, and the narrative starts at "The challenge" (no "Company Overview" heading).
- Same challenge/solution/result columns and same "kick the tires" closing CTA.

**Farming Maintenance** — older page, structurally divergent (higher risk):
- Headline "Conquering binders, breakdowns, and big changes" with a sub-headline; H1 customer-name treatment differs.
- Uses an **infographic image** rather than logo + challenge/solution/result bullet columns.
- Embedded **YouTube** video (`youtube.com/watch?v=jyRf5K6Q-Kc`), not vidyard.
- Different closing CTA ("Join Ryan and 3,000 other maintenance teams…"), not the standard "kick the tires" band.
- DOM template likely differs from `div.case-studies-temp.cloeren` — selectors must be re-verified.

## Checklist

- [ ] **Scrape both source pages** — fetch each URL, extract metadata, download images, produce cleaned HTML + analysis JSON (per-page)
- [ ] **Verify DOM selectors** against each cleaned.html — confirm the `case-study-page` template's selectors (`div.case-studies-temp.cloeren > header`, `.ba-fiix`, `div.kick-the-tires`) match DLG; identify the actual container/section selectors for farming-maintenance
- [ ] **Register both URLs** — add both to `tools/importer/urls-case-study-page.txt` and to the `urls[]` of the `case-study-page` template (both in `page-templates.json` and the inline `PAGE_TEMPLATE` in `import-case-study-page.js`)
- [ ] **Extend parsers for farming-maintenance deviations** (only if the scrape confirms them):
  - hero: sub-headline handling, infographic image placement
  - video: YouTube embed link (cleanup/columns-media handling like the vidyard link)
  - challenge/solution/result: infographic vs `.ba-fiix` columns — add a DOM branch or fall back to default content
  - closing CTA: map the "Join Ryan…" banner (adjust `hero-cta` branch or add section mapping)
- [ ] **Add new block variants / section styles only if needed** — extract computed styles from the source for visual fidelity; avoid new blocks where an existing branch works
- [ ] **Re-bundle the import script** (`import-case-study-page.bundle.js`) if any parser/transformer changed
- [ ] **Run the bulk import** for both URLs via the bundled import script (no hand-authored HTML in `content/`)
- [ ] **Preview & verify each page** in the local preview — hero, logo/headshot, columns, narrative headings/paragraphs, video, images, and CTA — comparing against the live pages
- [ ] **Visual critique & fix** — compare each migrated page to its source and correct any styling/layout/CSS discrepancies (iterate)
- [ ] **Lint** (`npm run lint`) and confirm clean render for both pages
- [ ] **Publish / next steps** — confirm with you before uploading the pages to the content source and (optionally) opening a PR for any new block/CSS changes

## Open questions (non-blocking)

- **Farming-maintenance fidelity:** its closing CTA and challenge/solution layout differ from the standard case-study pattern. Default plan is to **match the live site faithfully**; if you'd instead prefer normalizing it to the standard "kick the tires" CTA + column layout for consistency across case studies, I can do that during execution.

Switch to **Execute mode** and I'll start by scraping both pages and verifying their DOM against the existing template.
