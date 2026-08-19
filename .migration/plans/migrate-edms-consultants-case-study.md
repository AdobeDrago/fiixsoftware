# Migrate Case Study Page — EDMS Consultants

**Reference migrations:** `universal-pure`, `dlg-group` (already migrated on EDS)
**Source URL:** `https://fiixsoftware.com/resource-center/case-studies/edms-consultants/`

> Execution requires **Execute mode**. This artifact is the plan.

## Approach

Reuse the existing, proven `case-study-page` migration infrastructure — no new blocks, parsers, or transformers are expected:
- **Template:** `case-study-page` in `tools/importer/page-templates.json` (mirrored inline in `import-case-study-page.js`)
- **Parsers:** `hero-case-study.js`, `columns-media.js` (its `.ba-fiix` branch), `hero-cta.js`
- **Transformers:** `fiix-cleanup.js`, `fiix-sections.js`
- **Blocks/CSS:** `hero-case-study`, `columns-media`, `hero-cta` (already styled to match the live design)

The hero selector was generalized during the DLG/farming migration to `div.case-studies-temp > header`, so it will match this page regardless of its layout modifier class.

## Structure assessment (from live-page inspection)

EDMS Consultants is structurally the same shape as Universal Pure:
- **Hero:** H1 "EDMS Consultants" + H2 headline + "Back to case studies" link.
- **Customer intro:** company logo (`/wp-content/uploads/2024/01/EDMS-Logo.png`), headshot (`edms-taher-headshot.webp`), person name **Mohammad Thaqif Taher**, title **Application Consultant, EDMS**, and an intro summary paragraph.
- **Challenge / Solution / Result columns** with bullet lists (the `.ba-fiix` pattern).
- **Narrative sections:** Challenge, Solution, Result with paragraphs and quantified results (88% PM compliance; 4.52% monthly downtime).
- **No embedded video, no image gallery/carousel** — so none of the farming-maintenance special-casing applies.
- **Closing CTA:** standard "Just looking to kick the tires a bit?" band.

## Checklist

- [ ] **Verify DOM selectors** — fetch the page and confirm the `case-study-page` selectors match: `div.case-studies-temp > header`, `div.company-intro div.ba-fiix` / `.ba-fiix`, and `div.kick-the-tires`; note the actual `case-studies-temp` modifier class
- [ ] **Register the URL** — add `edms-consultants/` to `tools/importer/urls-case-study-page.txt` and to the template's `urls[]` (both `page-templates.json` and the inline `PAGE_TEMPLATE` in `import-case-study-page.js`)
- [ ] **Confirm no infrastructure changes needed** — verify the existing parsers/transformers cover this page (headshot + person name/title handled as default content, as on Universal Pure); only extend a parser branch if the scrape surfaces an unexpected layout
- [ ] **Re-bundle the import script** (`import-case-study-page.bundle.js`) only if any parser/transformer changed
- [ ] **Run the bulk import** for the URL via the bundled import script (no hand-authored HTML in `content/`)
- [ ] **Preview & verify** the rendered page — hero, logo, headshot, person name/title, intro, challenge/solution/result columns, narrative headings/paragraphs, images, and CTA — comparing against the live page
- [ ] **Visual critique & fix** — compare the migrated page to the source and correct any styling/layout/CSS discrepancies (iterate)
- [ ] **Lint** (`npm run lint`) and confirm the page renders cleanly in preview
- [ ] **Publish / next steps** — confirm with you before uploading the page to the content source and (optionally) committing the URL registration

## Open questions

None blocking — this is a straightforward single-page migration onto the established case-study template. Switch to **Execute mode** and I'll verify the selectors, register the URL, run the import, and verify the result.
