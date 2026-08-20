# Migrate Scotts Miracle-Gro Case Study Page

## Overview

The source page **https://fiixsoftware.com/resource-center/case-studies/scotts-miracle-gro/** is structurally identical to the already-migrated **universal-pure** case study. Both use the shared `div.case-studies-temp` template layout:

- **Hero** — company name (H1), headline (H2), "Back to case studies" link → `hero-case-study` block
- **Company intro** — logo image, person profile (headshot + name + title), lead paragraph → decomposed into `case-study-logo` / `case-study-profiles` / `case-study-lead` blocks
- **Challenge / Solution / Result** — three-column band → `columns-media` block (`.ba-fiix`)
- **Company overview** — heading + narrative paragraphs, embedded Vidyard/YouTube video, and expanded Challenge/Solution/Results narrative sections → default content + `youtube-video` block
- **Closing CTA** — "Just looking to kick the tires a bit?" free-tour band → `hero-cta` block

Because the `case-study-page` template, its four parsers (`hero-case-study`, `case-study-intro-components`, `columns-media`, `hero-cta`), and both transformers (`fiix-cleanup`, `fiix-sections`) already exist and were validated against Universal Pure and three other case studies, **no new blocks, parsers, or transformers are needed**. This is a content import that reuses existing infrastructure.

## Content Mapping (verified against Universal Pure)

| Source element | Target block / treatment |
|---|---|
| `div.case-studies-temp > header` | `hero-case-study` |
| `.company-intro` logo figure | `case-study-logo` (size variant by width) |
| `.company-intro` profile (`.intro-flex`) | `case-study-profiles` |
| `.company-intro` lead paragraph(s) | `case-study-lead` |
| `.ba-fiix` challenge/solution/result | `columns-media` |
| Company overview heading + paragraphs | default content (section style `case-study-overview`) |
| Vidyard/YouTube embed | `youtube-video` block |
| `.kick-the-tires` | `hero-cta` (section style `cta`) |
| Page title/description/og:title | metadata block |

## Approach Notes

- Add the Scotts Miracle-Gro URL to the `case-study-page` template so the migration runs through the existing pipeline (the template already lists 6 URLs; Scotts is not yet among them).
- One watch item: the source embeds a **Vidyard** video (`play.vidyard.com/…`), whereas the intro parser's `youtube-video` handling keys on `youtube.com`/`youtu.be` iframes. On Universal Pure the Vidyard link fell through as a plain link/default content. Verify in preview how the Vidyard embed renders and confirm it matches Universal Pure's behavior (acceptable fallback) — no code change unless it renders broken.
- The `.ba-fiix` challenge/solution/result columns may be absent or structured differently; the importer's empty-block guard handles graceful fallthrough to default content (as with `farming-maintenance`).

## Checklist

- [ ] Confirm the Scotts source DOM matches the template selectors (`div.case-studies-temp > header`, `.company-intro`, `.ba-fiix`, `.kick-the-tires`) by inspecting the scraped HTML
- [ ] Add `https://fiixsoftware.com/resource-center/case-studies/scotts-miracle-gro/` to the `case-study-page` template URL list in `page-templates.json` and to `urls-case-study-page.txt`
- [ ] Run the bundled case-study import script (`import-case-study-page.bundle.js`) against the Scotts URL via the bulk-import runner
- [ ] Confirm output written to `content/resource-center/case-studies/scotts-miracle-gro.plain.html`
- [ ] Verify all sections migrated: hero, logo, profile, lead, challenge/solution/result columns, company overview, video, CTA, and metadata
- [ ] Preview `scotts-miracle-gro` in the local dev server and compare rendering side-by-side with the original page (structure and styling)
- [ ] Specifically verify the Vidyard video embed renders correctly (or falls back cleanly, matching Universal Pure)
- [ ] Run `npm run lint` and fix any issues
- [ ] Report results to the user with a preview comparison summary

> **Note:** This plan was built in Plan mode. Executing the migration (editing files, running the import script, previewing) requires switching to Execute mode.
