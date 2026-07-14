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
            // Column heading text is the first text node before the nested <ul>.
            const heading = ((g.firstChild && g.firstChild.textContent) || '').trim();
            // "Features" renders as two sub-columns (matches TARGET).
            if (/^Features$/i.test(heading)) g.classList.add('nav-col-split');
            // Per-item: convert a trailing FEATURED / NEW token into a badge.
            // Target has no per-item icons, so none are injected. The trailing
            // description text (a bare text node after the link) is wrapped in a
            // span so it can render on its own line below the title.
            g.querySelectorAll(':scope > ul > li > a').forEach((a) => {
              extractBadge(a);
              const li = a.closest('li');
              const descText = [...li.childNodes]
                .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
              if (descText.length) {
                const desc = document.createElement('span');
                desc.className = 'nav-item-desc';
                descText.forEach((n) => { desc.append(n.textContent); n.remove(); });
                li.append(desc);
              }
              // "Download full features list" and "More industry solutions"
              // are flagged so CSS can add the trailing arrow affordance.
              const label = a.textContent.trim().toLowerCase();
              if (label.startsWith('download full features')) li.classList.add('nav-link-download');
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
