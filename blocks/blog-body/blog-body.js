/*
 * Blog article body.
 *
 * Splits the authored article into the narrow reading column and the CTA rail
 * beside it, then applies the decorations the live Fiix blog adds to article
 * copy: a bordered table of contents, boxed inline CTAs and a reading progress
 * bar pinned under the nav.
 */

/* The CTA rail is 340px wide, so image links authored at that width belong in
   it. Wider banners are inline artwork and stay with the copy. */
const RAIL_WIDTH = 340;

/* The source's promo-band icon graphics (a circle and a hexagon) are
   authored at 200x200; anything wider is a content image (a chart, a
   screenshot) rather than a decorative icon. */
const ICON_WIDTH = 200;

/* The importer flattened the live site's visually hidden "opens in a new tab"
   labels into plain text. Splitting a text node on the label lets us hide it
   again without losing it for screen readers. */
const NEW_TAB_LABEL = /(\s*\(opens in (?:a )?new tab\))/i;

function isRailPromo(element) {
  const image = element.querySelector(':scope > a img[width]');
  return !!image && Number(image.getAttribute('width')) <= RAIL_WIDTH;
}

function stripNewTabLabel(text) {
  return text.replace(NEW_TAB_LABEL, '').trim();
}

function isLinkOnly(element) {
  const link = element.querySelector(':scope > a');
  if (!link) return false;
  return stripNewTabLabel(element.textContent) === stripNewTabLabel(link.textContent);
}

function hideNewTabLabels(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const labelled = [];
  while (walker.nextNode()) {
    if (NEW_TAB_LABEL.test(walker.currentNode.nodeValue)) labelled.push(walker.currentNode);
  }
  labelled.forEach((node) => {
    const fragment = document.createDocumentFragment();
    node.nodeValue.split(NEW_TAB_LABEL).forEach((part, index) => {
      if (!part) return;
      if (index % 2 === 0) {
        fragment.append(part);
        return;
      }
      const hidden = document.createElement('span');
      hidden.className = 'blog-body-sr-only';
      hidden.textContent = part;
      fragment.append(hidden);
    });
    node.replaceWith(fragment);
  });
}

/**
 * IDs of the article's own numbered/lettered sections (the "Table of
 * contents" list's link targets). A heading that's one of the article's own
 * sections is never a promotional aside, even when a standalone link happens
 * to follow it (e.g. "1. A template for..." followed by its download link),
 * so `decorateInlineCtas` leaves those alone rather than boxing them.
 * @param {Element} column The reading column
 * @returns {Set<string>} lower-cased id fragments referenced by the ToC
 */
/**
 * Strips a leading list-item number (as in "1-a-template-for-...") so a ToC
 * anchor fragment can be compared against the heading's own id, which the
 * importer generates without that prefix.
 * @param {string} id An id or href fragment
 * @returns {string} The id with any leading "<number>-" removed
 */
function stripNumberPrefix(id) {
  return id.toLowerCase().replace(/^\d+-/, '');
}

function getTableOfContentsIds(column) {
  const heading = [...column.querySelectorAll(':scope > p')]
    .find((paragraph) => /^table of contents$/i.test(paragraph.textContent.trim()));
  const list = heading && heading.nextElementSibling;
  if (!list || list.tagName !== 'UL') return new Set();
  return new Set(
    [...list.querySelectorAll('a[href^="#"]')]
      .map((a) => stripNumberPrefix(a.getAttribute('href').slice(1))),
  );
}

/**
 * Boxes a heading and the standalone link that follows it into a CTA panel.
 * @param {Element} column The reading column
 */
function decorateInlineCtas(column) {
  const tocIds = getTableOfContentsIds(column);
  [...column.querySelectorAll(':scope > h2, :scope > h3')].forEach((heading) => {
    if (tocIds.has(stripNumberPrefix(heading.id))) return;
    const link = heading.nextElementSibling;
    if (!link || link.tagName !== 'P' || !isLinkOnly(link)) return;
    const panel = document.createElement('div');
    panel.className = 'blog-body-cta';
    heading.before(panel);
    panel.append(heading, link);
  });
}

function isPictureOnlyParagraph(element) {
  return !!element && element.tagName === 'P' && !element.textContent.trim()
    && element.children.length === 1 && element.firstElementChild.tagName === 'PICTURE';
}

function isIconOnlyParagraph(element) {
  if (!isPictureOnlyParagraph(element)) return false;
  const image = element.querySelector('img[width]');
  return !!image && Number(image.getAttribute('width')) <= ICON_WIDTH;
}

/* A promo teaser is a short marketing blurb (e.g. "Need help narrowing down
   your options? Read our short guide to choosing a CMMS" -- a question plus
   a call to action is still one teaser line), not multi-sentence body copy.
   A long paragraph is an article paragraph that happens to sit next to an
   image and a link -- not a promo band. */
function looksLikePromoTeaser(text) {
  return text.split(/\s+/).filter(Boolean).length <= 25;
}

/**
 * Boxes the "Get the guide"-style promo (an optional run of standalone icon
 * graphics, a plain-text teaser line, then a standalone link) into the
 * rounded, light-blue card the source renders it as, rather than leaving it
 * to read as a run of unrelated paragraphs.
 * @param {Element} column The reading column
 */
function decoratePromoBand(column) {
  [...column.querySelectorAll(':scope > p')].forEach((link) => {
    // a picture-only link (no button text of its own) is a rail promo, not
    // this text-button promo band
    if (!isLinkOnly(link) || !stripNewTabLabel(link.textContent)) return;
    const heading = link.previousElementSibling;
    if (!heading || heading.tagName !== 'P') return;
    if (heading.querySelector('a, picture') || !heading.textContent.trim()) return;
    if (!looksLikePromoTeaser(heading.textContent.trim())) return;

    // artwork is what makes this a promo: without it, a teaser line followed by
    // a standalone link is just copy followed by an inline call to action, which
    // the source leaves in the flow of the article.
    // The graphic directly against the heading can be any size (e.g. the navy
    // variant's oversized ebook cover); anything further back must be
    // icon-sized, or it's unrelated content artwork like a chart or diagram
    let el = heading.previousElementSibling;
    if (!isPictureOnlyParagraph(el)) return;
    const icons = [el];
    el = el.previousElementSibling;
    while (isIconOnlyParagraph(el)) {
      icons.unshift(el);
      el = el.previousElementSibling;
    }

    const promo = document.createElement('div');
    promo.className = 'blog-body-promo';
    const content = document.createElement('div');
    content.className = 'blog-body-promo-content';
    icons.forEach((icon, index) => {
      const picture = icon.querySelector('picture');
      const image = picture.querySelector('img[width]');
      const isGraphic = image && Number(image.getAttribute('width')) > ICON_WIDTH;
      if (isGraphic) {
        picture.classList.add('blog-body-promo-graphic');
        promo.classList.add('blog-body-promo-dark');
      } else {
        picture.classList.add('blog-body-promo-icon');
        if (index === icons.length - 1) picture.classList.add('blog-body-promo-icon-featured');
      }
    });
    (icons[0] || heading).before(promo);
    promo.append(...icons.map((icon) => icon.querySelector('picture')), content);
    content.append(heading, link);
  });
}

/**
 * Puts an icon graphic beside its `<h3>` step (and that step's own copy),
 * matching the source's `.blog-flex` rows, instead of leaving the icon to
 * render at its native size above a heading it's meant to sit next to.
 * @param {Element} column The reading column
 */
function decorateFlexSections(column) {
  [...column.querySelectorAll(':scope > p')].filter(isIconOnlyParagraph).forEach((icon) => {
    const heading = icon.nextElementSibling;
    if (!heading || heading.tagName !== 'H3') return;

    // the step's first paragraph always belongs to it; any further paragraph
    // only belongs to it too when it's another "<strong>Label:</strong> ..."
    // line (as with "Challenge:"/"Recommendation:") -- otherwise it's the
    // start of unrelated prose that follows the last step in the section
    const copy = [];
    for (
      let el = heading.nextElementSibling;
      el && el.tagName === 'P' && !isIconOnlyParagraph(el) && !el.querySelector(':scope > iframe')
        && (copy.length === 0 || el.firstElementChild?.tagName === 'STRONG');
      el = el.nextElementSibling
    ) {
      copy.push(el);
    }

    const row = document.createElement('div');
    row.className = 'blog-body-flex';
    const iconCol = document.createElement('div');
    iconCol.className = 'blog-body-flex-icon';
    const textCol = document.createElement('div');
    textCol.className = 'blog-body-flex-text';
    icon.before(row);
    row.append(iconCol, textCol);
    iconCol.append(icon.querySelector('picture'));
    textCol.append(heading, ...copy);
  });
}

/**
 * Splits a `<br>`-separated paragraph ("label:<br>numerator ÷<br>denominator
 * <br>× 100%<br>= result%") into the source's flex formula row: a label, a
 * stacked fraction (numerator over denominator, divided by a rule instead of
 * a visible ÷), then the multiplier and result -- instead of leaving it as
 * one paragraph of hard line breaks.
 * @param {Element} column The reading column
 */
function decorateFormulas(column) {
  [...column.querySelectorAll(':scope > p')].forEach((paragraph) => {
    if (paragraph.querySelector('a, picture')) return;

    const parts = [];
    let current = document.createDocumentFragment();
    [...paragraph.childNodes].forEach((node) => {
      if (node.nodeName === 'BR') {
        parts.push(current);
        current = document.createDocumentFragment();
      } else {
        current.append(node.cloneNode(true));
      }
    });
    parts.push(current);
    if (parts.length !== 5) return;

    const text = (fragment) => fragment.textContent.trim();
    if (!/^[×x]/i.test(text(parts[3])) || !text(parts[4]).startsWith('=')) return;

    const formula = document.createElement('div');
    formula.className = 'blog-body-formula';

    const label = document.createElement('p');
    label.textContent = text(parts[0]);

    const fraction = document.createElement('div');
    fraction.className = 'blog-body-formula-fraction';
    const numerator = document.createElement('p');
    numerator.append(text(parts[1]).replace(/[÷/]\s*$/, '').trim());
    const divisionLabel = document.createElement('span');
    divisionLabel.className = 'blog-body-sr-only';
    divisionLabel.textContent = ' ÷';
    numerator.append(divisionLabel);
    const denominator = document.createElement('p');
    denominator.textContent = text(parts[2]);
    fraction.append(numerator, denominator);

    const multiplier = document.createElement('p');
    multiplier.textContent = text(parts[3]);
    const result = document.createElement('p');
    result.textContent = text(parts[4]);

    formula.append(label, fraction, multiplier, result);
    paragraph.replaceWith(formula);
  });
}

/* Each of these players needs its own iframe height (YouTube is a 16:9
   video; a podcast player is a short, mostly-fixed-height widget), so the
   embed carries a class naming which one it is rather than one generic
   embed style. */
const EMBED_PATTERNS = [
  { test: /^https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\//i, className: 'blog-body-embed-video' },
  { test: /^https:\/\/anchor\.fm\/.*\/embed\//i, className: 'blog-body-embed-anchor' },
  { test: /^https:\/\/accendoreliability\.com\/.*[?&]embed=true(&|$)/i, className: 'blog-body-embed-accendo' },
  { test: /^https:\/\/w\.soundcloud\.com\/player\//i, className: 'blog-body-embed-soundcloud' },
];

/**
 * Swaps a paragraph holding a bare video/podcast embed URL for the actual
 * player, matching the source rather than showing the raw link. Left nested
 * in the original paragraph (as the source has it) rather than replacing it,
 * so it picks up the same 20px copy indent every other paragraph gets.
 * @param {Element} column The reading column
 */
function decorateEmbeds(column) {
  [...column.querySelectorAll(':scope > p')].forEach((paragraph) => {
    const link = paragraph.querySelector(':scope > a');
    if (!link || paragraph.children.length !== 1) return;
    const pattern = EMBED_PATTERNS.find(({ test }) => test.test(link.href));
    if (!pattern) return;
    const iframe = document.createElement('iframe');
    iframe.src = link.href;
    iframe.title = 'Embedded media';
    iframe.loading = 'lazy';
    iframe.classList.add(pattern.className);
    if (pattern.className === 'blog-body-embed-video') {
      iframe.allowFullscreen = true;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    }
    paragraph.replaceChildren(iframe);
  });
}

/**
 * Marks a standalone link sitting between paragraphs, which the source styles
 * as a bold line of its own with a trailing arrow (`a.blog-link`) rather than
 * as underlined copy.
 * @param {Element} column The reading column
 */
function decorateStandaloneLinks(column) {
  [...column.querySelectorAll(':scope > p')].forEach((paragraph) => {
    if (!isLinkOnly(paragraph)) return;
    const text = stripNewTabLabel(paragraph.textContent);
    // a picture link is a promo banner, and a bare URL is an embed the source
    // renders as a player, neither of which reads as a call to action
    if (!text || /^https?:\/\//.test(text)) return;
    paragraph.classList.add('blog-body-link');
  });
}

/**
 * Groups the authored "Table of contents" heading and its list into a nav.
 * @param {Element} column The reading column
 */
function decorateTableOfContents(column) {
  const heading = [...column.querySelectorAll(':scope > p')]
    .find((paragraph) => /^table of contents$/i.test(paragraph.textContent.trim()));
  const list = heading && heading.nextElementSibling;
  if (!list || list.tagName !== 'UL') return;
  const nav = document.createElement('nav');
  nav.className = 'blog-body-toc';
  nav.setAttribute('aria-label', heading.textContent.trim());
  heading.before(nav);
  nav.append(heading, list);
}

/**
 * Whether a paragraph is a short source caption under an image or boxed
 * example (`<small>` on live: "Click image to expand", "Example of…").
 * @param {Element} paragraph A paragraph element
 * @returns {boolean}
 */
function isImageCaption(paragraph) {
  if (paragraph.tagName !== 'P') return false;
  if (paragraph.querySelector('a, picture, strong, ul, ol')) return false;
  const text = paragraph.textContent.trim();
  return /^click image to expand$/i.test(text) || /^example of\b/i.test(text);
}

/**
 * Marks a caption paragraph and wraps its text in `<small>` so it matches
 * the source's 16px centered caption.
 * @param {Element} paragraph The caption paragraph
 */
function decorateImageCaption(paragraph) {
  paragraph.classList.add('blog-body-caption');
  if (paragraph.querySelector(':scope > small')) return;
  const small = document.createElement('small');
  small.append(...paragraph.childNodes);
  paragraph.append(small);
}

/**
 * Centers every "Click image to expand" / "Example of…" caption at 16px.
 * @param {Element} column The reading column
 */
function decorateImageCaptions(column) {
  [...column.querySelectorAll(':scope > p')]
    .filter(isImageCaption)
    .forEach(decorateImageCaption);
}

/**
 * Boxes a "Policy statement" heading with its intro and list into a grey
 * card, and leaves the following "Example of…" line outside as a caption —
 * used on template round-up posts where the example isn't under the full
 * "Asset management policy template" section heading.
 * @param {Element} column The reading column
 */
function decoratePolicyStatementBoxes(column) {
  [...column.querySelectorAll(':scope > h3')].forEach((heading) => {
    if (!/^policy statement$/i.test(heading.textContent.trim())) return;
    if (heading.closest('.blog-body-boxed')) return;

    const box = document.createElement('div');
    box.className = 'blog-body-boxed';
    heading.before(box);

    let el = heading;
    while (el) {
      const next = el.nextElementSibling;
      box.append(el);
      if (!next || next.tagName === 'H2' || next.tagName === 'H3') break;
      if (isImageCaption(next)) break;
      if (next.tagName !== 'P' && next.tagName !== 'UL') break;
      el = next;
    }
  });
}

/**
 * Boxes each `<h3>` step of the "Asset management policy template" example in
 * its own grey card, as the source does, instead of leaving them to read as
 * plain sub-headings indistinguishable from the rest of the article.
 * @param {Element} column The reading column
 */
function decorateTemplateBoxes(column) {
  const heading = [...column.querySelectorAll(':scope > h2')]
    .find((h2) => /^asset management policy template$/i.test(h2.textContent.trim()));
  if (!heading) return;

  const section = [];
  for (let el = heading.nextElementSibling; el && el.tagName !== 'H2'; el = el.nextElementSibling) {
    section.push(el);
  }

  let box;
  section.forEach((el) => {
    if (el.tagName === 'H3') {
      box = document.createElement('div');
      box.className = 'blog-body-boxed';
      el.before(box);
    }
    if (box) box.append(el);
  });
}

/**
 * Moves rail-width promos out of the copy and into a rail beside it.
 * @param {Element} layout The block's layout row
 * @param {Element} column The reading column
 */
function decorateRail(layout, column) {
  const promos = [...column.querySelectorAll(':scope > p')].filter(isRailPromo);
  if (!promos.length) return;
  const rail = document.createElement('aside');
  rail.className = 'blog-body-rail';
  rail.append(...promos);
  layout.append(rail);
}

/**
 * Caps the company logo that opens each "The company" case-study section at
 * the source's 300px, rather than the native export size (which for some of
 * these logos runs well past the column width).
 * @param {Element} column The reading column
 */
function decorateCompanyLogos(column) {
  [...column.querySelectorAll(':scope > h3')].forEach((heading) => {
    if (!/^the company$/i.test(heading.textContent.trim())) return;
    const picture = heading.nextElementSibling?.querySelector(':scope > picture');
    if (picture) picture.classList.add('blog-body-logo');
  });
}

/**
 * Turns the "Best practices for managing a facility shutdown" list into the
 * source's pair of shadowed cards, each with a centered bold title and a
 * checklist whose checkmark icon replaces the bullet marker, instead of a
 * plain nested list with icons stacked above their own line.
 * @param {Element} column The reading column
 */
function decorateShutdownChecklist(column) {
  const heading = [...column.querySelectorAll(':scope > h2')]
    .find((h2) => /^best practices for managing a facility shutdown$/i.test(h2.textContent.trim()));
  const list = heading && heading.nextElementSibling;
  if (!list || list.tagName !== 'UL') return;
  list.classList.add('blog-body-shutdown');

  [...list.children].forEach((card) => {
    card.classList.add('blog-body-shutdown-card');
    const title = card.querySelector(':scope > p');
    if (title) title.classList.add('blog-body-shutdown-title');
    const sublist = card.querySelector(':scope > ul');
    if (!sublist) return;
    sublist.querySelectorAll(':scope > li > p > picture').forEach((icon) => {
      icon.classList.add('blog-body-shutdown-icon');
    });
  });
}

/**
 * Floats an image the author dropped inline with copy (a `<picture>` sharing a
 * paragraph with trailing text) to the right of that text, as the source does,
 * rather than leaving it to break onto its own full-width line.
 * @param {Element} column The reading column
 */
function decorateInlineImages(column) {
  column.querySelectorAll(':scope > p > picture').forEach((picture) => {
    const { parentElement: paragraph } = picture;
    if (paragraph.childNodes.length > 1 && paragraph.textContent.trim()) {
      picture.classList.add('blog-body-inline-image');
    }
  });
}

/**
 * Pairs a standalone icon (a `<picture>` alone in its paragraph) with the
 * caption paragraph that follows it into a row, matching the source's icon +
 * text layout instead of stacking them full-width.
 * @param {Element} column The reading column
 */
function decorateIconRows(column) {
  [...column.querySelectorAll(':scope > p > picture')].forEach((picture) => {
    const { parentElement: iconParagraph } = picture;
    if (iconParagraph.children.length > 1 || iconParagraph.textContent.trim()) return;
    const caption = iconParagraph.nextElementSibling;
    if (!caption || caption.tagName !== 'P' || !caption.querySelector(':scope > strong')) return;
    const row = document.createElement('div');
    row.className = 'blog-body-icon-row';
    iconParagraph.before(row);
    row.append(iconParagraph, caption);
  });
}

/**
 * Marks the lead content image (source `.key-image`) so it can take the
 * production `margin: 40px 0 60px` rather than the default content-image gap.
 * @param {Element} column The reading column
 */
function decorateKeyImage(column) {
  const picture = [...column.querySelectorAll(':scope > p > picture')]
    .find((pic) => !pic.closest('.blog-body-icon-row')
      && !pic.classList.contains('blog-body-inline-image')
      && !pic.classList.contains('blog-body-logo'));
  if (picture) picture.classList.add('blog-body-key-image');
}

/**
 * Adds the reading progress bar and keeps it in step with the scroll position.
 * @param {Element} block The block element
 */
function addReadingProgress(block) {
  const track = document.createElement('div');
  track.className = 'blog-body-progress';
  const bar = document.createElement('div');
  track.append(bar);
  block.prepend(track);

  let queued = false;
  const update = () => {
    queued = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const read = scrollable > 0 ? window.scrollY / scrollable : 0;
    bar.style.width = `${Math.min(Math.max(read, 0), 1) * 100}%`;
  };
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const layout = block.firstElementChild;
  const column = layout && layout.firstElementChild;
  if (!column) return;
  layout.classList.add('blog-body-layout');
  column.classList.add('blog-body-column');

  decorateTemplateBoxes(column);
  decoratePolicyStatementBoxes(column);
  decorateImageCaptions(column);
  decorateEmbeds(column);
  decorateInlineCtas(column);
  decorateFormulas(column);
  decoratePromoBand(column);
  decorateStandaloneLinks(column);
  decorateFlexSections(column);
  decorateTableOfContents(column);
  decorateCompanyLogos(column);
  decorateShutdownChecklist(column);
  decorateInlineImages(column);
  decorateIconRows(column);
  decorateKeyImage(column);
  decorateRail(layout, column);
  hideNewTabLabels(block);
  addReadingProgress(block);
}
