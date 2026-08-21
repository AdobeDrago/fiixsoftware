import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlock,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
  readBlockConfig,
  toClassName,
  toCamelCase,
} from './aem.js';

/**
 * Applies Section Metadata to its parent section.
 *
 * This project's aem.js `decorateSections` omits the standard boilerplate
 * handling that reads a `.section-metadata` block and turns its `style` values
 * into section classes (and other keys into dataset entries). Without it the
 * metadata block is left in the DOM — it renders as literal "style / <value>"
 * text and gets picked up by `decorateBlocks` as an unknown block (404). The
 * migration pipeline (tools/importer/transformers/fiix-sections.js) emits these
 * blocks to drive section styles like `.section.cta`, so restore the standard
 * behavior here, between decorateSections and decorateBlocks.
 * @param {Element} main The container element
 */
function decorateSectionMetadata(main) {
  main.querySelectorAll(':scope > div.section').forEach((section) => {
    const sectionMeta = section.querySelector(':scope > div > div.section-metadata');
    if (!sectionMeta) return;
    const meta = readBlockConfig(sectionMeta);
    Object.keys(meta).forEach((key) => {
      if (key === 'style') {
        meta.style.split(',').map((s) => toClassName(s.trim())).filter((s) => s)
          .forEach((s) => section.classList.add(s));
      } else {
        section.dataset[toCamelCase(key)] = meta[key];
      }
    });
    // Remove the wrapper that holds only the metadata block so it is neither
    // rendered nor processed as a block by decorateBlocks.
    sectionMeta.parentElement.remove();
  });
}

const SECTION_CORNER_BACKGROUNDS = {
  backgroundTopRight: 'section-bg-top-right',
  backgroundBottomLeft: 'section-bg-bottom-left',
  backgroundTopLeft: 'section-bg-top-left',
  backgroundBottomRight: 'section-bg-bottom-right',
};

/**
 * Turns an authored metadata value into a CSS background-image.
 * Accepts image URLs or raw CSS (e.g. linear-gradient(...)).
 * @param {string} value
 * @returns {string}
 */
function toSectionBackgroundImage(value) {
  // Authors often paste a full CSS declaration including a trailing `;`.
  // `element.style.backgroundImage = '…;'` is rejected by the browser.
  const trimmed = value.trim().replace(/;+\s*$/, '');
  if (!trimmed) return '';
  if (/^(?:url\(|(?:repeating-)?(?:linear|radial|conic)-gradient\()/i.test(trimmed)) {
    return trimmed;
  }
  let src = trimmed;
  try {
    const url = new URL(trimmed, window.location.href);
    // Content sometimes authors https://localhost/... — use the current origin.
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      src = `${window.location.origin}${url.pathname}${url.search}`;
    } else {
      src = url.href;
    }
  } catch {
    // keep authored string
  }
  const escaped = src.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `url("${escaped}")`;
}

/**
 * Renders section-metadata corner backgrounds
 * (`background-top-right`, `background-bottom-left`, `background-top-left`,
 * `background-bottom-right`) as decorative layers — same role as production
 * `.augury::before` / `::after` on /cmms/ai/.
 * @param {Element} main
 */
function decorateSectionCornerBackgrounds(main) {
  main.querySelectorAll(':scope > div.section').forEach((section) => {
    let hasCorner = false;
    Object.entries(SECTION_CORNER_BACKGROUNDS).forEach(([datasetKey, className]) => {
      const value = section.dataset[datasetKey];
      if (!value) return;
      const backgroundImage = toSectionBackgroundImage(value);
      if (!backgroundImage) return;

      const layer = document.createElement('div');
      layer.className = `section-bg ${className}`;
      layer.setAttribute('aria-hidden', 'true');
      layer.style.backgroundImage = backgroundImage;
      section.prepend(layer);
      hasCorner = true;
    });
    if (hasCorner) section.classList.add('has-section-bg');
  });
}

/**
 * Applies authored `background` / `background-image` section metadata as the
 * section's CSS background-image (gradients or image URLs).
 * @param {Element} main
 */
function decorateSectionBackgroundImages(main) {
  main.querySelectorAll(':scope > div.section').forEach((section) => {
    const value = section.dataset.backgroundImage || section.dataset.background;
    if (!value) return;
    const backgroundImage = toSectionBackgroundImage(value);
    if (!backgroundImage) return;
    section.style.backgroundImage = backgroundImage;
  });
}

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * Load the local fallback fonts and brand font after the first section is
 * ready, then set a session storage flag for subsequent navigations.
 */
async function loadFonts() {
  await Promise.all([
    loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`),
    loadCSS('https://use.typekit.net/xfz3qzj.css'),
  ]);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Blog articles are authored as a header section (the lead image plus a
 * `hero-article` block), an unstyled body section, a `blog-share` section and a
 * closing `blog-cta` section.
 *
 * Wraps the body in a `blog-body` block so the reading column, its CTA rail and
 * the article typography stay self-contained, and lifts the promo that trails
 * the share links into a band of its own. The live site keeps every blog CTA
 * band hidden and reveals a single one per page view, so pick the winner here,
 * before the sections are shown.
 * @param {Element} main The container element
 */
function buildBlogArticleBlocks(main) {
  const header = main.querySelector(':scope > div.blog-article-header');
  if (!header) return;
  document.body.classList.add('blog-article');

  // the import left empty sections behind, which render as dead vertical space
  [...main.children]
    .filter((section) => !section.childElementCount)
    .forEach((section) => section.remove());

  const sections = [...main.children];
  const body = sections
    .slice(sections.indexOf(header) + 1)
    .find((section) => !section.className && section.childElementCount);
  if (body) {
    // nested blocks (tables, and so on) move inside the new block, out of reach
    // of decorateBlocks, so decorate them here to keep them loadable.
    const nested = [...body.children].filter((child) => child.tagName === 'DIV');
    body.append(buildBlock('blog-body', { elems: [...body.children] }));
    nested.forEach((block) => {
      // the policy administration rows are authored as an `effective-from` block,
      // but they are the same data table the `table` block renders
      block.classList.replace('effective-from', 'table');
      decorateBlock(block);
    });
  }

  const share = main.querySelector(':scope > div.blog-share');
  if (share) {
    // the share links are labelled "opens in a new tab", so make them behave so
    share.querySelectorAll('li a[href^="http"]').forEach((link) => {
      link.target = '_blank';
      link.rel = 'noopener';
    });
  }

  const promoHeading = share && share.querySelector('h2, h3, h4');
  if (promoHeading) {
    const promo = [];
    for (let el = promoHeading; el; el = el.nextElementSibling) promo.push(el);
    const band = buildBlock('columns-blog-cta', [[
      { elems: promo.filter((el) => !el.querySelector('picture')) },
      { elems: promo.filter((el) => el.querySelector('picture')) },
    ]]);
    band.classList.add('promo');
    const section = document.createElement('div');
    section.className = 'blog-promo';
    section.append(band);
    share.after(section);
  }

  const bands = [...main.querySelectorAll(':scope > div.blog-cta, :scope > div.blog-promo')];
  if (bands.length) {
    bands[Math.floor(Math.random() * bands.length)].classList.add('cta-selected');
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
    buildBlogArticleBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Groups blog listing hero copy and media so the gray band can lay out as
 * two columns, matching the live Fiix Blog header. Also buttonizes the CTA
 * when authors invert `<a><strong>` instead of `<strong><a>`.
 * @param {Element} main The main container element
 */
function decorateBlogHeader(main) {
  const wrap = main.querySelector('.section.blog-header .default-content-wrapper');
  if (!wrap || wrap.querySelector('.blog-header-copy')) return;

  const children = [...wrap.children];
  const media = children.find((el) => el.matches('picture') || el.querySelector('picture'));
  const copy = document.createElement('div');
  copy.className = 'blog-header-copy';
  children.forEach((el) => {
    if (el !== media) copy.append(el);
  });
  if (media) media.classList.add('blog-header-media');
  wrap.replaceChildren(copy, ...(media ? [media] : []));

  const cta = copy.querySelector('p a[href]');
  if (cta && !cta.classList.contains('button')) {
    const p = cta.closest('p');
    p.className = 'button-wrapper';
    cta.className = 'button primary';
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateSectionMetadata(main);
  decorateSectionBackgroundImages(main);
  decorateSectionCornerBackgrounds(main);
  decorateBlocks(main);
  decorateButtons(main);
  decorateBlogHeader(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
/**
 * Add a body class derived from the URL path (e.g.
 * `page-cmms-parts-inventory-management-software`) so page-specific CSS can
 * target a single page. EDS gives every page the same block/section classes and
 * no page-level hook; this provides one. Purely additive; runs before `.appear`
 * so styles keyed on it apply with no flash.
 */
function decoratePageClass() {
  const slug = window.location.pathname
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase();
  if (slug) document.body.classList.add(`page-${slug}`);
}

async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decoratePageClass();
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    // The LCP image may not be in the very first section (e.g. an announcement
    // bar precedes the hero), so eager-load every section up to and including
    // the first one that contains an image.
    const sections = [...main.querySelectorAll('.section')];
    const lcpIndex = sections.findIndex((s) => s.querySelector('img'));
    const lastEager = lcpIndex === -1 ? 0 : lcpIndex;
    for (let i = 0; i <= lastEager; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await loadSection(sections[i], waitForFirstImage);
    }
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 960 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
