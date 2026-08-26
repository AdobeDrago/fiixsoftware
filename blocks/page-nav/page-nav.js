/**
 * page-nav -- in-page anchor navigation bar.
 *
 * Authoring model (2-column table, one row per link):
 *   | col 1: icon image | col 2: link text -> #section-id |
 * The icon sits stacked above its label (matching the source design). Column 1
 * may be empty (label-only link). Order is preserved.
 *
 * A legacy single-column model (a <ul> of anchor links, no icons) is also
 * supported so older authored content keeps working.
 *
 * The `sticky` variant pins the bar below the fixed site header while scrolling
 * and enables an active-section highlight; the base bar scrolls with the page.
 */

/**
 * How much of the viewport top is permanently covered once the bar is stuck:
 * the bar's own height plus everything above it. The bar's sticky `top` is
 * exactly that "everything above it" distance (it's what holds the bar clear of
 * the fixed site header), so reading it back keeps this in step with the CSS
 * instead of hard-coding the header's height here.
 * @param {Element} block the block element (carries the `sticky` variant)
 * @param {Element} nav the nav element
 * @returns {number} pixels obscured at the top of the viewport
 */
function obstructedHeight(block, nav) {
  // A static bar scrolls away with the page, so it obscures nothing.
  if (!block.classList.contains('sticky')) return 0;
  const section = block.closest('.page-nav-container');
  if (!section) return nav.getBoundingClientRect().height;
  const stickyTop = parseFloat(getComputedStyle(section).top);
  // The section, not the bar, is what's pinned -- measuring it picks up its
  // bottom border too, which the bar's own box stops short of.
  return (Number.isNaN(stickyTop) ? 0 : stickyTop) + section.getBoundingClientRect().height;
}

/**
 * Smooth-scroll to the target section, landing it just below the stuck bar
 * rather than underneath it.
 * @param {Element} block the block element (carries the `sticky` variant)
 * @param {Element} nav the nav element
 * @param {string} hash the target fragment (e.g. "#reviews")
 */
function scrollToTarget(block, nav, hash) {
  const target = document.querySelector(hash);
  if (!target) return;
  const offset = obstructedHeight(block, nav);
  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

/**
 * Highlight the link matching the section currently in view.
 * @param {Element} nav the nav element
 * @param {Map<string, HTMLAnchorElement>} linkByHash hash -> anchor
 */
function observeSections(nav, linkByHash) {
  const setActive = (hash) => {
    linkByHash.forEach((a, key) => {
      a.classList.toggle('page-nav-active', key === hash);
    });
  };

  const targets = [...linkByHash.keys()]
    .map((hash) => document.querySelector(hash))
    .filter(Boolean);
  if (targets.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible.length > 0) {
      setActive(`#${visible[0].target.id}`);
    }
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  targets.forEach((t) => observer.observe(t));
}

/**
 * Collect the authored links as { icon, href, label } items, preserving order.
 * Handles the 2-column table (icon | link) and the legacy list-of-anchors.
 * @param {Element} block the block element
 * @returns {{icon: Element|null, href: string, label: string}[]}
 */
function collectItems(block) {
  const items = [];

  // 2-column rows: block > div (row) > div (col). First col = icon, last = link.
  const rows = [...block.children].filter((row) => row.querySelector('a[href^="#"]'));
  rows.forEach((row) => {
    const cols = [...row.children];
    if (!cols.length) return;
    const link = row.querySelector('a[href^="#"]');
    if (!link) return;
    const icon = cols.length > 1 ? cols[0].querySelector('picture, img') : null;
    items.push({ icon, href: link.getAttribute('href'), label: link.textContent.trim() });
  });

  if (items.length) return items;

  // Legacy: a flat list of in-page anchors, no icons.
  [...block.querySelectorAll('a[href^="#"]')].forEach((a) => {
    items.push({ icon: null, href: a.getAttribute('href'), label: a.textContent.trim() });
  });
  return items;
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const items = collectItems(block);
  // Nothing to build if the author added no in-page anchor links.
  if (items.length === 0) return;

  const nav = document.createElement('nav');
  nav.className = 'page-nav-bar';
  nav.setAttribute('aria-label', 'In-page navigation');

  const list = document.createElement('ul');
  list.className = 'page-nav-list';

  const linkByHash = new Map();

  items.forEach(({ icon, href, label }) => {
    const item = document.createElement('li');
    item.className = 'page-nav-item';

    const link = document.createElement('a');
    link.className = 'page-nav-link';
    link.href = href;

    // Icon (stacked above the label) — decorative, so hidden from a11y tree.
    if (icon) {
      const iconWrap = document.createElement('span');
      iconWrap.className = 'page-nav-icon';
      iconWrap.setAttribute('aria-hidden', 'true');
      iconWrap.append(icon);
      link.append(iconWrap);
    }

    const text = document.createElement('span');
    text.className = 'page-nav-label';
    text.textContent = label;
    link.append(text);

    link.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToTarget(block, nav, href);
      window.history.replaceState(null, '', href);
    });

    // Keyed by hash for the scroll-spy; if two links share a target the later
    // one wins the highlight (both still render and scroll correctly).
    linkByHash.set(href, link);
    item.append(link);
    list.append(item);
  });

  nav.append(list);

  block.textContent = '';
  block.append(nav);

  // The active-section highlight is only visible while the bar stays on screen,
  // i.e. the sticky variant. A static bar scrolls away, so skip the observer.
  if (block.classList.contains('sticky')) observeSections(nav, linkByHash);
}
