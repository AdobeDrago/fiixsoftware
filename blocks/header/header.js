import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// Keep in sync with header.css 960px breakpoint.
const isDesktop = window.matchMedia('(min-width: 960px)');

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

// Toggle mobile drawer.
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // Close open panels when drawer toggles.
  closeAllPanels(navSections);
  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

// Click/keyboard toggle for mega-menu items (no hover).
function decorateDropItem(navItem, navSections) {
  navItem.classList.add('nav-drop');
  navItem.setAttribute('aria-haspopup', 'true');
  navItem.setAttribute('aria-expanded', 'false');
  navItem.setAttribute('tabindex', '0');

  navItem.addEventListener('click', (e) => {
    // Ignore clicks on panel links.
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

// Per-item cyan icons, keyed by the authored href. Renaming/moving a nav link's
// URL silently drops its icon (iconForHref returns null) — update the key here too.
const ICON_STROKE = 'stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const svg = (paths) => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" ${ICON_STROKE}>${paths}</svg>`;
const NAV_ICONS = {
  '/cmms/cmms-software/': svg('<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18M8 21h8"/>'),
  '/cmms/mobile-cmms/': svg('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'),
  '/foresight/': svg('<path d="M12 3v2M12 19v2M3 12h2M19 12h2M6 6l1.5 1.5M16.5 16.5 18 18"/><circle cx="12" cy="12" r="4"/>'),
  // Fiix AI
  '/cmms/ai/': svg('<path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z"/><path d="M18.5 13l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7Z"/>'),
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
  // Support
  '/training-and-implementation/': svg('<rect x="3" y="4" width="18" height="13" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 14-5-4-8 6"/>'),
  'https://helpdesk.fiixsoftware.com/hc/en-us': svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.5 2.5 0 1 1 3 2.4c-.6.3-.9.8-.9 1.6"/><path d="M12 17h.01"/>'),
  '/premium-support/': svg('<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>'),
  '/community/': svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c.6.6 1 1.4 1 2h6c0-.6.4-1.4 1-2a6 6 0 0 0-4-10Z"/>'),
  // Resources
  '/resource-center/': svg('<rect x="4" y="3" width="7" height="18" rx="1"/><rect x="13" y="3" width="7" height="18" rx="1"/><path d="M7 7h1M16 7h1"/>'),
  '/blog/': svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  '/resource-center/ebook/': svg('<path d="M12 6c-2-1.4-5-1.4-7 0v12c2-1.4 5-1.4 7 0M12 6c2-1.4 5-1.4 7 0v12c-2-1.4-5-1.4-7 0M12 6v14"/>'),
  '/about-us/partnerships/': svg('<path d="M10 4a2 2 0 1 1 4 0v2h3a1 1 0 0 1 1 1v3h2a2 2 0 1 1 0 4h-2v3a1 1 0 0 1-1 1h-3v2a2 2 0 1 1-4 0v-2H7a1 1 0 0 1-1-1v-3H4a2 2 0 1 1 0-4h2V7a1 1 0 0 1 1-1h3Z"/>'),
  '/resource-center/case-studies/': svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  '/customers/': svg('<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/>'),
};

// Resolve icon for href (trailing-slash tolerant).
function iconForHref(href) {
  if (!href) return null;
  const bare = href.replace(/\/+$/, '');
  const hit = NAV_ICONS[href] || NAV_ICONS[bare] || NAV_ICONS[`${bare}/`];
  if (hit) return hit;
  if (bare.startsWith('/downloads')) return NAV_ICONS['/downloads/'];
  return null;
}

// Split Features into two lists: primary features + download | secondary links.
// Matches production `.navigation__dropdown__column-wrapper` with two `<ul>`s.
// Drawer: download sits after Fiix app exchange (end of secondary list).
// Desktop: download sits under the primary feature column.
function splitFeaturesColumn(col) {
  const list = col.querySelector(':scope > ul');
  if (!list) return;

  const items = [...list.children];
  const download = items.find((li) => li.classList.contains('nav-link-download'));
  const rest = items.filter((li) => li !== download);
  // First four stay in the primary column; the rest move to a second column.
  const secondary = rest.slice(4);
  if (!secondary.length && !download) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-col-wrapper';
  const secondaryList = document.createElement('ul');
  secondary.forEach((li) => secondaryList.append(li));

  list.replaceWith(wrapper);
  wrapper.append(list, secondaryList);

  const placeDownload = () => {
    if (!download) return;
    if (isDesktop.matches) list.append(download);
    else secondaryList.append(download);
  };
  placeDownload();
  isDesktop.addEventListener('change', placeDownload);
}

/** Shared Contact us / Request a demo footer for every mega-menu. */
function buildMegaMenuFooter(source) {
  const footerLi = document.createElement('li');
  footerLi.className = 'nav-drop-footer';
  if (source) {
    source.querySelectorAll('a').forEach((a) => footerLi.append(a.cloneNode(true)));
    return footerLi;
  }
  const contact = document.createElement('a');
  contact.href = '/contact-us/';
  contact.textContent = 'Contact us';
  const demo = document.createElement('a');
  demo.href = 'https://lp.fiixsoftware.com/request-fiix-demo.html';
  demo.textContent = 'Request a demo';
  footerLi.append(contact, demo);
  return footerLi;
}

function ensureMegaMenuFooters(navSections) {
  const drops = [...navSections.querySelectorAll(':scope .nav-drop')];
  const source = drops.map((d) => d.querySelector(':scope > ul > .nav-drop-footer')).find(Boolean);
  drops.forEach((drop) => {
    const panel = drop.querySelector(':scope > ul');
    if (!panel) return;
    // Keep footer as a direct panel child so it can span the full mega-menu grid.
    [...panel.querySelectorAll('.nav-drop-footer')].forEach((footer) => {
      if (footer.parentElement !== panel) panel.append(footer);
    });
    if (panel.querySelector(':scope > .nav-drop-footer')) return;
    panel.append(buildMegaMenuFooter(source));
  });
}

// Wrap loose description text in .nav-item-desc for mobile hide.
function wrapDescription(container) {
  const nodes = [...container.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  if (!nodes.length) return null;
  const desc = document.createElement('span');
  desc.className = 'nav-item-desc';
  nodes.forEach((n) => { desc.append(n.textContent); n.remove(); });
  container.append(desc);
  return desc;
}

// FEATURED / NEW → badge pill.
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

/** @param {Element} block */
export default async function decorate(block) {
  // Load nav fragment (localhost /content, else root).
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  // The local dev server serves the same root nav fragment as preview/live.
  // Avoid probing the legacy /content/nav path, which is not present locally
  // and creates a noisy 404 in the browser console on every page load.
  const fragment = await loadFragment(navPath);
  if (!fragment) {
    // eslint-disable-next-line no-console
    console.warn('[header] no nav fragment found at', navPath);
    return;
  }

  // Build nav DOM.
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // Rebase relative nav image paths to root-absolute.
  nav.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith('/')) {
      img.setAttribute('src', `/${src.replace(/^\.?\/*/, '')}`);
    }
  });

  // Strip button styles from logo.
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a');
    if (brandLink) {
      brandLink.className = '';
      const bc = brandLink.closest('.button-container');
      if (bc) bc.className = '';
    }
  }

  // Mega-menu drops from nested lists.
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navItem) => {
      const panel = navItem.querySelector(':scope > ul');
      if (panel) {
        decorateDropItem(navItem, navSections);
        // Grouped columns (e.g. Product).
        const groups = [...panel.children].filter((li) => li.querySelector(':scope > ul'));
        if (groups.length) {
          navItem.classList.add('nav-drop-grouped');
          groups.forEach((g) => {
            g.classList.add('nav-col');
            // Column heading = non-<ul> children.
            const heading = [...g.childNodes]
              .filter((n) => n.nodeName !== 'UL')
              .map((n) => n.textContent)
              .join(' ')
              .trim();
            // Features → two sub-columns matching production
            // (main features + download | parts + app exchange).
            if (/^Features$/i.test(heading)) g.classList.add('nav-col-split');
            // Industry is desktop mega-menu only.
            if (/^Industry/i.test(heading)) g.classList.add('nav-col-industry');
            // Icon + title/badge + description.
            g.querySelectorAll(':scope > ul > li > a').forEach((a) => {
              const li = a.closest('li');
              extractBadge(a);
              const badge = a.nextElementSibling
                && a.nextElementSibling.classList.contains('nav-badge')
                ? a.nextElementSibling : null;
              const icon = iconForHref(a.getAttribute('href'));

              const desc = wrapDescription(li);

              // Title + badge row.
              const titleLine = document.createElement('span');
              titleLine.className = 'nav-item-title';
              titleLine.append(a);
              if (badge) titleLine.append(badge);

              const main = document.createElement('span');
              main.className = 'nav-item-main';
              main.append(titleLine);
              if (desc) main.append(desc);

              if (icon) {
                const span = document.createElement('span');
                span.className = 'nav-item-icon';
                span.innerHTML = icon;
                li.append(span);
              }
              li.append(main);

              // Special link styles.
              const label = a.textContent.trim().toLowerCase();
              if (label.startsWith('download full features')) {
                li.classList.add('nav-link-download');
                const fullLabel = a.textContent.trim();
                const clean = fullLabel.replace(/\s*\(PDF\).*$/i, '').trim();
                const mobileText = /\(PDF\)/i.test(fullLabel) ? fullLabel : `${clean} (PDF)`;
                a.textContent = '';
                // Drawer: plain label + left icon. Desktop: see-all + trailing icon.
                const mobileLabel = document.createElement('span');
                mobileLabel.className = 'nav-download-mobile-label';
                mobileLabel.textContent = mobileText;
                const seeAll = document.createElement('span');
                seeAll.className = 'nav-download-see-all';
                const labelEl = document.createElement('span');
                labelEl.className = 'nav-download-label';
                labelEl.append(document.createTextNode(clean));
                const sr = document.createElement('span');
                sr.className = 'nav-sr-only';
                sr.textContent = ' PDF document';
                labelEl.append(sr);
                const iconEl = document.createElement('span');
                iconEl.className = 'nav-download-icon';
                iconEl.setAttribute('aria-hidden', 'true');
                iconEl.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="m8 11 4 4 4-4"/><path d="M5 20h14"/></svg>';
                seeAll.append(labelEl, iconEl);
                a.append(mobileLabel, seeAll);
              }
              if (label.startsWith('more industry')) li.classList.add('nav-link-more');
            });

            // Split Features into two lists like production column-wrapper.
            if (g.classList.contains('nav-col-split')) splitFeaturesColumn(g);
          });
        } else if (panel.querySelector('li img')) {
          // Promo panel (text links + cards).
          navItem.classList.add('nav-drop-promo');
          const items = [...panel.children].filter((li) => li.tagName === 'LI');
          const textGroup = document.createElement('li');
          textGroup.className = 'nav-promo-text';
          const promoGroup = document.createElement('li');
          promoGroup.className = 'nav-promo-panel';
          items.forEach((li) => {
            if (li.querySelector('img')) {
              li.classList.add('nav-promo-card');
              const imgP = [...li.children].find((c) => c.querySelector && c.querySelector('img'));
              const link = li.querySelector('a[href]');
              const body = document.createElement('div');
              body.className = 'nav-promo-body';
              [...li.children].forEach((c) => { if (c !== imgP) body.append(c); });
              if (link) {
                const more = document.createElement('a');
                more.className = 'nav-promo-more';
                more.href = link.getAttribute('href');
                more.textContent = 'Read more';
                body.append(more);
              }
              li.append(body);
              promoGroup.append(li);
            } else {
              // Icon + wrap description for mobile hide.
              const link = li.querySelector('a[href]');
              const label = link && link.closest('p');
              if (label) wrapDescription(label);
              const icon = link && iconForHref(link.getAttribute('href'));
              if (icon) {
                const span = document.createElement('span');
                span.className = 'nav-promo-icon';
                span.innerHTML = icon;
                li.prepend(span);
              }
              textGroup.append(li);
            }
          });
          // 2 columns; rows = ceil(n/2) so Support is 2×2 and Resources is 2×3.
          const promoRows = Math.max(1, Math.ceil(textGroup.children.length / 2));
          textGroup.style.setProperty('--promo-rows', String(promoRows));
          textGroup.dataset.promoRows = String(promoRows);
          panel.append(textGroup, promoGroup);
        }
        // Footer is the <p> after the panel <ul>, not the label <p>.
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

    // Reuse Product footer links on Support / Resources when not authored.
    ensureMegaMenuFooters(navSections);
  }

  // Click-away closes panels.
  document.addEventListener('click', (e) => {
    if (navSections && !e.target.closest('.nav-drop')) closeAllPanels(navSections);
  });

  // Mark CTAs; split Search/Login into utility row.
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const toolsList = navTools.querySelector('ul');
    navTools.querySelectorAll('a').forEach((a) => {
      const label = a.textContent.trim().toLowerCase();
      if (label === 'book a demo' || label === 'request a demo') {
        a.classList.add('nav-cta', 'nav-cta-primary');
        a.dataset.labelDesktop = 'Book a demo';
        a.dataset.labelMobile = 'Request a demo';
      }
      if (label === 'free tour') a.classList.add('nav-cta', 'nav-cta-secondary');
      if (label === 'search' || label === 'search..') {
        a.classList.add('nav-search');
        a.textContent = 'Search..';
      }
      if (label === 'login') a.classList.add('nav-login');
    });

    // Drawer-only Contact us (production mobile order).
    if (toolsList && !toolsList.querySelector('.nav-contact-drawer')) {
      const contactLi = document.createElement('li');
      contactLi.className = 'nav-contact-drawer';
      const contact = document.createElement('a');
      contact.href = '/contact-us/';
      contact.textContent = 'Contact us';
      contact.classList.add('nav-cta', 'nav-contact');
      contactLi.append(contact);
      toolsList.append(contactLi);
    }

    const syncToolsForViewport = () => {
      navTools.querySelectorAll('a[data-label-desktop]').forEach((a) => {
        a.textContent = isDesktop.matches
          ? a.dataset.labelDesktop
          : a.dataset.labelMobile;
      });
      if (!toolsList) return;
      const freeTour = toolsList.querySelector('a.nav-cta-secondary')?.closest('li');
      const requestDemo = toolsList.querySelector('a.nav-cta-primary')?.closest('li');
      const contact = toolsList.querySelector('.nav-contact-drawer');
      if (isDesktop.matches) {
        // Desktop pills: Book a demo, Free tour.
        if (requestDemo) toolsList.append(requestDemo);
        if (freeTour) toolsList.append(freeTour);
      } else {
        // Drawer: Free tour, Request a demo, Contact us.
        if (freeTour) toolsList.append(freeTour);
        if (requestDemo) toolsList.append(requestDemo);
        if (contact) toolsList.append(contact);
      }
    };
    syncToolsForViewport();
    isDesktop.addEventListener('change', syncToolsForViewport);

    const utilityItems = [...(toolsList ? toolsList.children : [])]
      .filter((li) => li.querySelector('a.nav-search, a.nav-login'));
    if (utilityItems.length) {
      const utility = document.createElement('div');
      utility.className = 'nav-utility';
      const utilityList = document.createElement('ul');
      utilityItems.forEach((li) => utilityList.append(li));
      utility.append(utilityList);
      nav.append(utility);
    }
  }

  // Hamburger.
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // Reset on breakpoint change.
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, navSections, isDesktop.matches);
    closeAllPanels(navSections);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
