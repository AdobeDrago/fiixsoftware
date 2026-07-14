import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeAllPanels(navSections, { focusOut = false } = {}) {
  if (!navSections) return;
  navSections.querySelectorAll(':scope .nav-drop[aria-expanded="true"]').forEach((drop) => {
    drop.setAttribute('aria-expanded', 'false');
  });
  if (focusOut) document.activeElement?.blur?.();
}

function closeOnEscape(e) {
  if (e.code !== 'Escape') return;
  const nav = document.getElementById('nav');
  const navSections = nav?.querySelector('.nav-sections');
  if (!navSections) return;
  if (isDesktop.matches) {
    closeAllPanels(navSections);
  } else {
    // eslint-disable-next-line no-use-before-define
    toggleMenu(nav, navSections, false);
    nav.querySelector('.nav-hamburger button')?.focus();
  }
}

/**
 * Toggles the entire nav (mobile drawer)
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // collapse any open dropdowns when the drawer state changes
  closeAllPanels(navSections);
  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * Wire up a top-level nav item that owns a dropdown/mega-menu panel.
 * Hover opens on desktop; click toggles on mobile and for keyboard users.
 */
function decorateDropItem(navItem, navSections) {
  navItem.classList.add('nav-drop');
  navItem.setAttribute('aria-expanded', 'false');
  navItem.setAttribute('tabindex', '0');

  const open = () => { if (isDesktop.matches) navItem.setAttribute('aria-expanded', 'true'); };
  const close = () => { if (isDesktop.matches) navItem.setAttribute('aria-expanded', 'false'); };

  navItem.addEventListener('mouseenter', open);
  navItem.addEventListener('mouseleave', close);

  navItem.addEventListener('click', (e) => {
    // Only toggle when the label area (not a real link inside the panel) is clicked.
    if (e.target.closest('.nav-drop > ul a')) return;
    const expanded = navItem.getAttribute('aria-expanded') === 'true';
    closeAllPanels(navSections);
    navItem.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });

  navItem.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' || e.code === 'Space') {
      if (e.target !== navItem) return;
      e.preventDefault();
      const expanded = navItem.getAttribute('aria-expanded') === 'true';
      closeAllPanels(navSections);
      navItem.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    }
  });
}

// Cyan line icons (inline SVG) keyed by nav item. Matches the Fiix source
// per-item iconography with a consistent 20px / 1.6 stroke in brand teal.
const ICON_STROKE = 'stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const svg = (paths) => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" ${ICON_STROKE}>${paths}</svg>`;
const NAV_ICONS = {
  '/cmms/cmms-software/': svg('<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18M8 21h8"/>'),
  '/cmms/mobile-cmms/': svg('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'),
  '/foresight/': svg('<path d="M12 3v2M12 19v2M3 12h2M19 12h2M6 6l1.5 1.5M16.5 16.5 18 18"/><circle cx="12" cy="12" r="4"/>'),
  '/optix': svg('<path d="M12 2a5 5 0 0 1 5 5c0 2-1 3-2 4s-1 2-1 3H10c0-1 0-2-1-3S7 9 7 7a5 5 0 0 1 5-5Z"/><path d="M9 21h6"/>'),
  '/cmms/asset-management-software/': svg('<path d="M20 7 12 3 4 7l8 4 8-4Z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/>'),
  '/cmms/work-orders/': svg('<path d="m14 7 3-3 3 3-3 3"/><path d="M17 4v9a4 4 0 0 1-4 4H4"/><path d="m7 20-3-3 3-3"/>'),
  '/cmms/integrations/': svg('<circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h6a3 3 0 0 1 3 3v6"/>'),
  '/cmms/maintenance-reporting-software/': svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  '/cmms/parts-inventory-management-software/': svg('<path d="M3 7h18v13H3zM3 7l3-4h12l3 4M8 12h8"/>'),
  '/app-exchange/': svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  '/downloads/': svg('<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16"/>'),
  '/cmms/industry-solutions/oil-gas-maintenance-software/': svg('<path d="M6 21V8l6-5 6 5v13"/><path d="M9 21v-6h6v6"/>'),
  '/cmms/industry-solutions/heavy-equipment-maintenance-software/': svg('<circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M9 18h6M5 18H3v-5l4-1 3-5h5l2 6h2v5h-2"/>'),
  '/cmms/industry-solutions/food-and-beverage-maintenance-software/': svg('<path d="M6 2v7a3 3 0 0 0 6 0V2M9 2v20M17 2c-1.5 1-2 3-2 6s.5 4 2 5v9"/>'),
  '/cmms/industry-solutions/manufacturing-maintenance-software/': svg('<path d="M3 20V9l6 4V9l6 4V5l6 4v11H3Z"/>'),
};

/** Match a nav link href to a cyan icon (exact, then prefix for /downloads/). */
function iconForHref(href) {
  if (!href) return null;
  if (NAV_ICONS[href]) return NAV_ICONS[href];
  if (href.startsWith('/downloads/')) return NAV_ICONS['/downloads/'];
  return null;
}

/** Turn a trailing FEATURED / NEW token in a link label into a badge pill. */
function extractBadge(link) {
  const m = link.textContent.match(/\s+(FEATURED|NEW)\s*$/);
  if (!m) return;
  const [, word] = m;
  link.textContent = link.textContent.slice(0, m.index).trim();
  const badge = document.createElement('span');
  badge.className = 'nav-badge';
  badge.textContent = word;
  link.after(badge);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment — dual path so it works on localhost (content under
  // /content) and on DA/EDS production (content at root).
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment('/content/nav') || await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Normalize nav image paths. The fragment lives at /content/nav but is
  // rendered on arbitrary page URLs, so relative "images/x" would resolve
  // against the page path. Rebase to a root-absolute path that the dev server
  // (content root) and production (content at root) both serve.
  nav.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith('/')) {
      img.setAttribute('src', `/${src.replace(/^\.?\/*/, '')}`);
    }
  });

  // Brand: strip button styling from the logo link
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a');
    if (brandLink) {
      brandLink.className = '';
      const bc = brandLink.closest('.button-container');
      if (bc) bc.className = '';
    }
  }

  // Main nav: top-level <li> that contain a nested <ul> become mega-menu drops
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navItem) => {
      const panel = navItem.querySelector(':scope > ul');
      if (panel) {
        decorateDropItem(navItem, navSections);
        // Grouped panel: its top-level items are column headings that each own
        // a nested <ul> of links (e.g. Product → Overview/Features/Industry).
        const groups = [...panel.children].filter((li) => li.querySelector(':scope > ul'));
        if (groups.length) {
          navItem.classList.add('nav-drop-grouped');
          groups.forEach((g) => {
            g.classList.add('nav-col');
            // Column heading is the text before the nested <ul>. Read every
            // non-<ul> child (text node or <p>) so DA whitespace/<p> wrapping
            // doesn't hide it — a bare firstChild check missed it on delivery.
            const heading = [...g.childNodes]
              .filter((n) => n.nodeName !== 'UL')
              .map((n) => n.textContent)
              .join(' ')
              .trim();
            // "Features" renders as two sub-columns (matches TARGET).
            if (/^Features$/i.test(heading)) g.classList.add('nav-col-split');
            // Per-item structure: icon (col 1) + a main block (col 2) that
            // stacks a title line (link + inline badge) over the description.
            g.querySelectorAll(':scope > ul > li > a').forEach((a) => {
              const li = a.closest('li');
              extractBadge(a);
              const badge = a.nextElementSibling
                && a.nextElementSibling.classList.contains('nav-badge')
                ? a.nextElementSibling : null;
              const icon = iconForHref(a.getAttribute('href'));

              // Move the trailing description text node into its own element.
              const descNodes = [...li.childNodes]
                .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());

              // Title line keeps the link and badge on one row.
              const titleLine = document.createElement('span');
              titleLine.className = 'nav-item-title';
              titleLine.append(a);
              if (badge) titleLine.append(badge);

              const main = document.createElement('span');
              main.className = 'nav-item-main';
              main.append(titleLine);
              if (descNodes.length) {
                const desc = document.createElement('span');
                desc.className = 'nav-item-desc';
                descNodes.forEach((n) => { desc.append(n.textContent); n.remove(); });
                main.append(desc);
              }

              if (icon) {
                const span = document.createElement('span');
                span.className = 'nav-item-icon';
                span.innerHTML = icon;
                li.append(span);
              }
              li.append(main);

              // "Download full features list" and "More industry solutions"
              // render as plain blue links with an arrow (F1 / G1).
              const label = a.textContent.trim().toLowerCase();
              if (label.startsWith('download full features')) {
                li.classList.add('nav-link-download');
                // Strip the source's "(PDF)" + size note so the link reads clean.
                a.textContent = a.textContent.replace(/\s*\(PDF\).*$/i, '').trim();
              }
              if (label.startsWith('more industry')) li.classList.add('nav-link-more');
            });
          });
        }
        // Footer = a <p> that comes AFTER the panel <ul> (e.g. "Contact us |
        // Request a demo"). Must check position: Document Authoring wraps the
        // trigger label itself in a leading <p> (e.g. <p>Product</p>), so a
        // plain ':scope > p' would wrongly grab the label. Only a <p> whose
        // position follows the panel is the footer.
        const kids = [...navItem.children];
        const panelIndex = kids.indexOf(panel);
        const footer = kids.find((el, i) => el.tagName === 'P' && i > panelIndex);
        if (footer) {
          const footerLi = document.createElement('li');
          footerLi.className = 'nav-drop-footer';
          while (footer.firstChild) footerLi.append(footer.firstChild);
          footer.remove();
          panel.append(footerLi);
        }
      }
    });
  }

  // Tools: mark CTA buttons (last two links) so CSS can style them as buttons
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    navTools.querySelectorAll('a').forEach((a) => {
      const label = a.textContent.trim().toLowerCase();
      if (label === 'book a demo' || label === 'free tour') a.classList.add('nav-cta');
      if (label === 'search') a.classList.add('nav-search');
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // reset state on breakpoint change (close drawer + panels)
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, navSections, isDesktop.matches);
    closeAllPanels(navSections);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
