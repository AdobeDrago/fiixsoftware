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

/* The importer flattened the live site's visually hidden "opens in a new tab"
   labels into plain text. Splitting a text node on the label lets us hide it
   again without losing it for screen readers. */
const NEW_TAB_LABEL = /(\s*\(opens in (?:a )?new tab\))/i;

function isRailPromo(element) {
  const image = element.querySelector(':scope > a img[width]');
  return !!image && Number(image.getAttribute('width')) <= RAIL_WIDTH;
}

function isLinkOnly(element) {
  const link = element.querySelector(':scope > a');
  if (!link) return false;
  const strip = (text) => text.replace(NEW_TAB_LABEL, '').trim();
  return strip(element.textContent) === strip(link.textContent);
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
 * Boxes a heading and the standalone link that follows it into a CTA panel.
 * @param {Element} column The reading column
 */
function decorateInlineCtas(column) {
  [...column.querySelectorAll(':scope > h2, :scope > h3')].forEach((heading) => {
    const link = heading.nextElementSibling;
    if (!link || link.tagName !== 'P' || !isLinkOnly(link)) return;
    const panel = document.createElement('div');
    panel.className = 'blog-body-cta';
    heading.before(panel);
    panel.append(heading, link);
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

  decorateInlineCtas(column);
  decorateTableOfContents(column);
  decorateRail(layout, column);
  hideNewTabLabels(block);
  addReadingProgress(block);
}
