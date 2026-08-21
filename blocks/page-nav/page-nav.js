/**
 * page-nav -- sticky in-page anchor navigation.
 *
 * Renders a horizontal bar of links that jump to sections elsewhere on the
 * same page (href="#section-id"). The bar sticks to the top of the viewport
 * as the reader scrolls, smooth-scrolls to the target on click, and highlights
 * the link whose target section is currently in view.
 *
 * Authoring model: one link per row (a single column containing an anchor
 * whose href is an in-page fragment, e.g. #reviews). Order is preserved.
 */

/**
 * Collect the anchors authored in the block into a single nav list.
 * @param {Element} block the block element
 * @returns {HTMLAnchorElement[]} the anchors, in document order
 */
function collectLinks(block) {
  const links = [...block.querySelectorAll('a[href]')];
  return links.filter((a) => a.getAttribute('href').startsWith('#'));
}

/**
 * Smooth-scroll to the target section. When the bar is sticky it overlaps the
 * content, so offset by its height; a static bar has already scrolled away and
 * needs no offset.
 * @param {Element} block the block element (carries the `sticky` variant)
 * @param {Element} nav the nav element
 * @param {string} hash the target fragment (e.g. "#reviews")
 */
function scrollToTarget(block, nav, hash) {
  const target = document.querySelector(hash);
  if (!target) return;
  const offset = block.classList.contains('sticky') ? nav.getBoundingClientRect().height : 0;
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
    // Prefer the entry closest to the top of the viewport that is intersecting.
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
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const links = collectLinks(block);
  // Nothing to build if the author added no in-page anchor links.
  if (links.length === 0) return;

  const nav = document.createElement('nav');
  nav.className = 'page-nav-bar';
  nav.setAttribute('aria-label', 'In-page navigation');

  const list = document.createElement('ul');
  list.className = 'page-nav-list';

  const linkByHash = new Map();

  links.forEach((a) => {
    const hash = a.getAttribute('href');
    const item = document.createElement('li');
    item.className = 'page-nav-item';

    const link = document.createElement('a');
    link.className = 'page-nav-link';
    link.href = hash;
    link.textContent = a.textContent.trim();

    link.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToTarget(block, nav, hash);
      window.history.replaceState(null, '', hash);
    });

    // Keyed by hash for the scroll-spy; if two links share a target the later
    // one wins the highlight (both still render and scroll correctly).
    linkByHash.set(hash, link);
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
