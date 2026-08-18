import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
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
 * Default base URL for content-hosted icon SVGs (DA content host). Icons are
 * authored as `:name:` tokens and rendered by aem.js's decorateIcons() from the
 * CODEBASE (`/icons/<name>.svg`). This project instead resolves them from
 * CONTENT so icons can be added/updated without a code deploy. Overridable
 * per-page with `<meta name="icon-base" content="…">`.
 */
const DEFAULT_ICON_BASE = 'https://content.da.live/adobedrago/fiixsoftware/icons/';

/**
 * Re-point decorated icon images (`span.icon > img`, built by aem.js's
 * decorateIcons from the codebase) at the CONTENT-hosted icon base, keeping the
 * author-typed `:name:` token. aem.js is never modified — this override runs in
 * project code after decorateIcons(). If the content-hosted SVG fails to load,
 * the img falls back to its original codebase `/icons/<name>.svg` so the icon
 * never 404s while content isn't published yet.
 *
 * @param {Element} root element (or block) containing decorated `span.icon` icons
 * @param {string} [base] icon base URL; defaults to the `icon-base` meta or DEFAULT_ICON_BASE
 */
export function resolveIconsFromContent(root, base) {
  const meta = document.querySelector('meta[name="icon-base"]');
  let iconBase = base || (meta && meta.content) || DEFAULT_ICON_BASE;
  if (!iconBase.endsWith('/')) iconBase += '/';

  root.querySelectorAll('span.icon > img[data-icon-name]').forEach((img) => {
    const name = img.dataset.iconName;
    if (!name) return;
    const codebaseSrc = img.getAttribute('src'); // aem.js set this to the codebase path
    const contentSrc = `${iconBase}${name}.svg`;

    // Graceful fallback: if the content-hosted SVG 404s/errors, restore the
    // codebase src (and re-sync the mask var, if the block uses one).
    img.addEventListener('error', function onError() {
      img.removeEventListener('error', onError);
      if (img.getAttribute('src') === codebaseSrc) return; // already on fallback
      img.src = codebaseSrc;
      const span = img.parentElement;
      if (span && span.style.getPropertyValue('--icon-mask')) {
        span.style.setProperty('--icon-mask', `url("${codebaseSrc}")`);
      }
    }, { once: true });

    img.src = contentSrc;
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
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
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
 * Applies `section-metadata` blocks to their sections.
 *
 * This project's `aem.js` ships a trimmed-down `decorateSections` that creates
 * sections but does NOT fold `section-metadata` key/value blocks into section
 * classes/data attributes (the stock boilerplate does this inside
 * `decorateSections`). Without it, authored section styles (e.g. `light`,
 * `grey`, `accent-yellow`) never become `.section.<style>` classes — the block
 * instead renders as stray "style / <value>" text and 404s trying to load a
 * non-existent `section-metadata` block. This restores the standard behavior
 * here in project code, leaving `aem.js` untouched.
 * @param {Element} main The main element
 */
function decorateSectionMetadata(main) {
  main.querySelectorAll('.section .section-metadata').forEach((sectionMeta) => {
    const section = sectionMeta.closest('.section');
    if (!section) return;
    const meta = readBlockConfig(sectionMeta);
    Object.keys(meta).forEach((key) => {
      if (key === 'style') {
        const styles = meta.style
          .split(',')
          .filter((style) => style)
          .map((style) => toClassName(style.trim()));
        styles.forEach((style) => section.classList.add(style));
      } else if (/^icon-colou?r$/.test(key)) {
        // Dedicated icon-tint field, orthogonal to `style` (background/layout).
        // Authors set an "Icon color" section-metadata row to any CSS colour;
        // expose it as the --icon-color custom property the blocks' masked icons
        // inherit. Match both US/UK spellings ("Icon color" / "Icon colour",
        // which readBlockConfig normalises to icon-color / icon-colour).
        const value = meta[key].trim();
        section.style.setProperty('--icon-color', value);
        section.dataset.iconColor = value;
      } else {
        section.dataset[toCamelCase(key)] = meta[key];
      }
    });
    const wrapper = sectionMeta.parentElement;
    sectionMeta.remove();
    // Remove the now-empty block wrapper this fork's decorateSections created.
    if (wrapper && wrapper !== section && wrapper.children.length === 0) wrapper.remove();
  });
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
  decorateBlocks(main);
  decorateButtons(main);
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
