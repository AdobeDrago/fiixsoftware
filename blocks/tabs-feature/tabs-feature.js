// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';
// eslint-disable-next-line import/no-cycle
import { loadFragment } from '../fragment/fragment.js';

// Feature videos are hosted on the origin site; the poster (still frame)
// filenames don't follow a strict transform of the video name, so map them
// explicitly by video basename.
const VIDEO_ORIGIN = 'https://fiixsoftware.com';
const VIDEO_POSTERS = {
  'work-management.mp4': '/wp-content/uploads/2020/07/Still_Work-management.png',
  'asset-management.mp4': '/wp-content/uploads/2020/07/Still_Asset-Management.png',
  'parts-and-supplies.mp4': '/wp-content/uploads/2020/07/Still_Parts-and-supplies.png',
  'mobile.mp4': '/wp-content/uploads/2020/07/Still_Mobile.png',
};

// Toggle authoring (3 columns): Label | List + image | Hotspot coords.
// Column 3 is an ordered/unordered list (or paragraphs) of:
//   31%, 4%
//   55%, 91% — optional override label
// top% then left%. Fallback: same lines after the image in column 2.
const HOTSPOT_RE = /^\s*(\d+(?:\.\d+)?)\s*%?\s*[,x×]\s*(\d+(?:\.\d+)?)\s*%?\s*(?:(?:[—–\-|:])\s*(.+))?$/i;

const toAbsolute = (path) => (/^https?:/i.test(path) ? path : `${VIDEO_ORIGIN}${path}`);

/**
 * A panel is a "fragment panel" when its content is nothing but a single
 * internal link/path (e.g. `/fragments/industry/manufacturing`). This is the
 * opt-in signal to render an external fragment; every existing panel shape
 * (text, media, video link, list, hotspots) fails this test and is untouched.
 * @param {Element} content the panel's content wrapper
 * @returns {string|null} the fragment path, or null if not a fragment panel
 */
function fragmentPath(content) {
  if (!content) return null;
  const links = content.querySelectorAll('a[href]');
  if (links.length !== 1) return null;
  const href = links[0].getAttribute('href') || '';
  // Internal path only (not an asset/video link, not an external URL).
  if (!href.startsWith('/') || href.startsWith('//')) return null;
  if (/\.(mp4|webm|mov|m4v|jpg|jpeg|png|gif|svg|webp)$/i.test(href)) return null;
  // The link must be the panel's sole meaningful content (ignore whitespace).
  if (content.querySelector('picture, img, video, ol, ul')) return null;
  const linkText = (links[0].textContent || '').replace(/\s+/g, ' ').trim();
  const allText = (content.textContent || '').replace(/\s+/g, ' ').trim();
  if (allText !== linkText && allText !== href) return null;
  return href;
}

/**
 * Load a fragment into a panel and inject its platform-decorated content.
 * loadFragment runs decorateMain + loadSections, so any block inside the
 * fragment is fully initialised — no manual decorateBlock, no nested tables.
 * Idempotent: only loads once per panel.
 * @param {Element} panel the tabpanel element
 * @param {string} path the fragment path
 */
async function loadPanelFragment(panel, path) {
  if (!path || panel.dataset.fragmentLoaded) return;
  panel.dataset.fragmentLoaded = 'true';
  const fragment = await loadFragment(path);
  if (!fragment) return;
  const target = panel.firstElementChild || panel;
  target.replaceChildren(...fragment.childNodes);
}

/**
 * Replace a bare video-asset link with a looping, muted inline video that
 * matches the production feature switcher. Only the active tab autoplays and
 * preloads; hidden tabs defer their download until shown (perf + parity —
 * production only autoplays the first tab).
 */
function replaceLinkWithVideo(link, active) {
  const href = link.getAttribute('href');
  const basename = href.split('/').pop().toLowerCase();
  const poster = VIDEO_POSTERS[basename];

  const video = document.createElement('video');
  video.className = 'tabs-feature-video';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', active ? 'metadata' : 'none');
  if (active) video.autoplay = true;
  if (poster) video.setAttribute('poster', toAbsolute(poster));

  const source = document.createElement('source');
  source.src = toAbsolute(href);
  source.type = 'video/mp4';
  video.append(source);

  link.replaceWith(video);
}

function isMediaPara(p) {
  return !!p.querySelector('picture, img');
}

function isAssetLinkPara(p) {
  const a = p.querySelector('a');
  return a && a.getAttribute('href') && /\.(mp4|webm|mov|m4v)$/i.test(a.getAttribute('href'));
}

function parseHotspotText(text) {
  const match = HOTSPOT_RE.exec((text || '').replace(/\s+/g, ' ').trim());
  if (!match) return null;
  return {
    top: Number(match[1]),
    left: Number(match[2]),
    label: (match[3] || '').trim(),
  };
}

/**
 * Parse hotspot coordinates from a dedicated authoring cell (column 3):
 * ordered/unordered list items and/or paragraphs like "31%, 4%".
 */
function extractHotspotsFromCell(cell) {
  if (!cell) return [];
  const hotspots = [];

  const pushText = (text) => {
    const parsed = parseHotspotText(text);
    if (parsed) hotspots.push(parsed);
  };

  cell.querySelectorAll(':scope > ol > li, :scope > ul > li').forEach((li) => pushText(li.textContent));
  cell.querySelectorAll(':scope > p').forEach((p) => pushText(p.textContent));

  // Bare text-only cell (single coordinate string, rare).
  if (!hotspots.length) pushText(cell.textContent);

  // Nested Top | Left | Label table inside the cell.
  cell.querySelectorAll(':scope > table tr').forEach((row) => {
    const cells = [...row.children].map((c) => c.textContent.trim());
    if (!cells.length) return;
    if (/^top$/i.test(cells[0]) && /^left$/i.test(cells[1] || '')) return;
    pushText(`${cells[0]}, ${cells[1] || ''}${cells[2] ? ` — ${cells[2]}` : ''}`);
  });

  return hotspots;
}

/**
 * Fallback: hotspot lines authored after the panel image in column 2.
 */
function extractHotspotsAfterMedia(content, mediaPara) {
  const hotspots = [];
  const children = [...content.children];
  const mediaIndex = mediaPara ? children.indexOf(mediaPara) : -1;
  const afterMedia = mediaIndex >= 0 ? children.slice(mediaIndex + 1) : [];

  afterMedia.forEach((el) => {
    if (el.tagName === 'P') {
      const parsed = parseHotspotText(el.textContent);
      if (parsed) {
        hotspots.push(parsed);
        el.remove();
      }
      return;
    }
    if (el.tagName === 'OL' || el.tagName === 'UL') {
      [...el.querySelectorAll(':scope > li')].forEach((li) => {
        const parsed = parseHotspotText(li.textContent);
        if (parsed) hotspots.push(parsed);
      });
      // Only remove if every item was a hotspot line.
      const allHotspots = [...el.querySelectorAll(':scope > li')]
        .every((li) => parseHotspotText(li.textContent));
      if (allHotspots) el.remove();
    }
  });

  return hotspots;
}

function popupPlacement(left) {
  if (left < 33) return 'popup-left';
  if (left > 67) return 'popup-right';
  return 'popup-bottom';
}

function buildHotspot(hotspot, index, open) {
  const spot = document.createElement('button');
  spot.type = 'button';
  spot.className = 'tabs-feature-hotspot';
  spot.style.top = `${hotspot.top}%`;
  spot.style.left = `${hotspot.left}%`;
  spot.setAttribute('aria-label', hotspot.label || `Highlight ${index + 1}`);
  spot.setAttribute('aria-expanded', open ? 'true' : 'false');

  // Three staggered ripples — production .intro-banner-vdo-play-btn .ripple
  for (let r = 0; r < 3; r += 1) {
    const ripple = document.createElement('span');
    ripple.className = 'tabs-feature-hotspot-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    spot.append(ripple);
  }

  const popup = document.createElement('span');
  popup.className = 'tabs-feature-hotspot-popup';
  popup.hidden = !open;
  popup.textContent = hotspot.label;
  // Left-side → open left; right-side → open right; middle → open bottom.
  popup.classList.add(popupPlacement(hotspot.left));
  spot.append(popup);

  return spot;
}

function decorateTogglePanel(content, hotspotCell) {
  if (!content) return;

  // Fragment panel takes precedence over the hotspot/list chrome.
  const fragPath = fragmentPath(content);
  if (fragPath) {
    loadPanelFragment(content.closest('.tabs-feature-panel') || content, fragPath);
    return;
  }

  const list = content.querySelector(':scope > ol, :scope > ul');
  if (list) list.classList.add('tabs-feature-points');

  const paras = [...content.querySelectorAll(':scope > p')];
  const mediaPara = paras.find((p) => isMediaPara(p) || isAssetLinkPara(p));
  if (!mediaPara) return;

  mediaPara.classList.add('tabs-feature-media');

  // Prefer column 3 coords; fall back to lines after the image in column 2.
  let hotspots = extractHotspotsFromCell(hotspotCell);
  if (!hotspots.length) hotspots = extractHotspotsAfterMedia(content, mediaPara);
  if (hotspotCell) hotspotCell.remove();

  const listItems = list ? [...list.querySelectorAll(':scope > li')] : [];

  // Fill missing hotspot labels from the numbered list (same order).
  hotspots.forEach((h, i) => {
    if (!h.label && listItems[i]) h.label = listItems[i].textContent.trim();
  });

  if (!hotspots.length) return;

  // Only switch to hotspot chrome when coordinates are authored; otherwise
  // keep the numbered list visible on desktop as the explainer.
  content.classList.add('has-hotspots');

  const stage = document.createElement('div');
  stage.className = 'tabs-feature-stage';
  mediaPara.replaceWith(stage);
  stage.append(mediaPara);

  hotspots.forEach((h, i) => {
    if (!h.label) return;
    stage.append(buildHotspot(h, i, i === 0));
  });

  // Mobile/tablet order: image + pins, then the numbered legend below.
  if (list) content.append(list);

  stage.addEventListener('click', (event) => {
    const spot = event.target.closest('.tabs-feature-hotspot');
    if (!spot || !stage.contains(spot)) return;
    stage.querySelectorAll('.tabs-feature-hotspot').forEach((btn) => {
      const isActive = btn === spot;
      btn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      const popup = btn.querySelector('.tabs-feature-hotspot-popup');
      if (popup) popup.hidden = !isActive;
    });
  });
}

/**
 * Toggle variation — pill switcher + screenshot with authorable hotspots.
 * Row shape: Label | List + image | Hotspot coords (optional 3rd column).
 * Isolated from the default tabs-feature path so other instances are untouched.
 */
function decorateToggle(block) {
  const tablist = document.createElement('div');
  tablist.className = 'tabs-feature-list';
  tablist.setAttribute('role', 'tablist');

  [...block.children].forEach((row, i) => {
    const cells = [...row.children];
    const tab = cells[0];
    const content = cells[1];
    const hotspotCell = cells[2] || null;
    if (!tab) return;

    const id = toClassName(tab.textContent);

    row.className = 'tabs-feature-panel';
    row.id = `tabpanel-${id}`;
    row.setAttribute('aria-hidden', !!i);
    row.setAttribute('aria-labelledby', `tab-${id}`);
    row.setAttribute('role', 'tabpanel');

    const button = document.createElement('button');
    button.className = 'tabs-feature-tab';
    button.id = `tab-${id}`;
    button.innerHTML = tab.innerHTML;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      row.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();

    decorateTogglePanel(content, hotspotCell);
  });

  block.prepend(tablist);
}

function decorateDefault(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-feature-list';
  tablist.setAttribute('role', 'tablist');

  // decorate tabs and tabpanels
  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-feature-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-feature-tab';
    button.id = `tab-${id}`;

    button.innerHTML = tab.innerHTML;

    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');

    tablist.append(button);
    tab.remove();

    // Opt-in: a panel whose sole content is an internal link renders that
    // fragment (any block[s]) instead of flat default content. Active tab loads
    // now; others defer to first activation (parity with deferred videos).
    // Read after tab.remove() so this is the content cell, not the label cell.
    const content = tabpanel.firstElementChild;
    const fragPath = fragmentPath(content);

    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
      if (fragPath) loadPanelFragment(tabpanel, fragPath);
      // start the newly shown panel's video (deferred tabs preload="none")
      const video = tabpanel.querySelector('video');
      if (video) {
        const play = video.play();
        if (play && typeof play.catch === 'function') play.catch(() => {});
      }
    });

    if (fragPath) {
      // Fragment panel: skip flat-content decoration entirely. Load eagerly for
      // the initially-visible tab; the rest load on first activation.
      if (i === 0) loadPanelFragment(tabpanel, fragPath);
      return;
    }

    // tag panel content for styling hooks (no behavioral change):
    // the media paragraph (screenshot/video) vs. the trailing stat/quote note
    if (content) {
      const paras = [...content.querySelectorAll(':scope > p')];
      const mediaPara = paras.find((p) => isMediaPara(p) || isAssetLinkPara(p));
      if (mediaPara) {
        mediaPara.classList.add('tabs-feature-media');
        // turn a bare video link into a real playing video (matches production)
        if (isAssetLinkPara(mediaPara)) replaceLinkWithVideo(mediaPara.querySelector('a'), i === 0);
      }
      const textParas = paras.filter((p) => !isMediaPara(p) && !isAssetLinkPara(p));
      const cta = textParas.find((p) => p.querySelector('a'));
      if (cta) cta.classList.add('tabs-feature-cta');
      // stat/quote note = trailing text paragraph AFTER the CTA (a distinct
      // supporting line). Skip when the only copy is the description itself.
      const ctaIndex = cta ? textParas.indexOf(cta) : -1;
      const note = ctaIndex >= 0
        ? textParas.slice(ctaIndex + 1).filter((p) => !p.querySelector('a')).pop()
        : null;
      if (note) note.classList.add('tabs-feature-note');
    }
  });

  block.prepend(tablist);
}

/**
 * Replaces the homepage tablist with a mobile dropdown below 768 px.
 * Mirrors production's .menu-mobile pattern: the active tab shows as a
 * bordered row with a chevron; tapping toggles the full list open/closed;
 * picking an item fires the real tab button and collapses the list.
 * Applied to both .section.feature-tabs.homepage and
 * .section.insights-tabs.homepage.
 */
function decorateMobileDropdown(block) {
  const tablist = block.querySelector('[role="tablist"]');
  if (!tablist) return;

  const mq = window.matchMedia('(width < 768px)');

  const dropdown = document.createElement('div');
  dropdown.className = 'tabs-feature-mobile-dropdown';
  dropdown.setAttribute('aria-hidden', 'true');

  const buildDropdown = () => {
    dropdown.innerHTML = '';
    const buttons = [...tablist.querySelectorAll('button')];
    const active = buttons.find((b) => b.getAttribute('aria-selected') === 'true') || buttons[0];

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tabs-feature-mobile-trigger';
    trigger.textContent = active ? active.textContent.trim() : '';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'listbox');

    const list = document.createElement('ul');
    list.className = 'tabs-feature-mobile-list';
    list.setAttribute('role', 'listbox');

    buttons.forEach((btn) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', btn.getAttribute('aria-selected'));
      li.textContent = btn.textContent.trim();
      li.addEventListener('click', () => {
        btn.click();
        trigger.textContent = btn.textContent.trim();
        trigger.setAttribute('aria-expanded', 'false');
        list.classList.remove('open');
        [...list.querySelectorAll('[aria-selected]')].forEach((item) => {
          item.setAttribute('aria-selected', item === li ? 'true' : 'false');
        });
      });
      list.append(li);
    });

    trigger.addEventListener('click', () => {
      const isOpen = list.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });

    // Close on outside click.
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        list.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    }, { capture: true });

    dropdown.append(trigger, list);
  };

  buildDropdown();

  // Keep trigger label in sync when tab changes via prev/next arrows.
  tablist.addEventListener('click', (e) => {
    const btn = e.target.closest('button[aria-selected]');
    if (!btn) return;
    const trigger = dropdown.querySelector('.tabs-feature-mobile-trigger');
    if (trigger) trigger.textContent = btn.textContent.trim();
    [...dropdown.querySelectorAll('.tabs-feature-mobile-list [aria-selected]')].forEach((item) => {
      item.setAttribute('aria-selected', item.textContent.trim() === btn.textContent.trim() ? 'true' : 'false');
    });
  });

  const show = () => {
    dropdown.setAttribute('aria-hidden', 'false');
    tablist.setAttribute('aria-hidden', 'true');
  };
  const hide = () => {
    dropdown.setAttribute('aria-hidden', 'true');
    tablist.removeAttribute('aria-hidden');
    dropdown.querySelector('.tabs-feature-mobile-list')?.classList.remove('open');
    const trigger = dropdown.querySelector('.tabs-feature-mobile-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  };

  if (mq.matches) show();
  mq.addEventListener('change', (e) => (e.matches ? show() : hide()));

  tablist.after(dropdown);
}

/**
 * Homepage feature-tabs — match production #feature-container.
 * Ensures the section carries `.homepage` (content may omit it) and moves
 * each panel's media to the panel root so CSS can absolutely position it
 * beside the text column like live's `<figure>`.
 *
 * Also reclassifies panel text that decorateDefault's generic cta/note
 * predicate gets wrong here: replaceLinkWithVideo strips the <a> from a video
 * paragraph, so decorateDefault's isMediaPara/isAssetLinkPara check no longer
 * recognizes it as media and can mis-tag it as the note. It also promotes a
 * link wrapped in <strong> (or an unwrapped .button.primary from
 * decorateButtons) into a category label, matching production's
 * h3-link-then-CTA panel shape — decorateDefault has no concept of a category.
 */
function decorateFeatureTabs(block) {
  const section = block.closest('.section.feature-tabs');
  if (!section) return;
  section.classList.add('homepage');

  block.querySelectorAll('.tabs-feature-panel').forEach((panel) => {
    const content = panel.firstElementChild;
    if (!content) return;

    const paras = [...content.querySelectorAll(':scope > p')];
    paras.forEach((p) => {
      if (!p.classList.contains('tabs-feature-media')) {
        p.classList.remove('tabs-feature-cta', 'tabs-feature-note');
      }
    });

    const textParas = paras.filter((p) => !p.classList.contains('tabs-feature-media'));
    const categoryPara = textParas.find((p) => {
      if (p.querySelector('strong > a, strong a')) return true;
      const link = p.querySelector(':scope > a.button.primary');
      return !!(link && p.classList.contains('button-wrapper') && !link.classList.contains('accent'));
    });
    if (categoryPara) {
      const link = categoryPara.querySelector('a');
      if (link) link.classList.remove('button', 'primary');
      categoryPara.classList.remove('button-wrapper');
      categoryPara.classList.add('tabs-feature-category');
    }

    const cta = textParas.find((p) => !p.classList.contains('tabs-feature-category') && p.querySelector('a'));
    if (cta) cta.classList.add('tabs-feature-cta');
    const ctaIndex = cta ? textParas.indexOf(cta) : -1;
    const note = ctaIndex >= 0
      ? textParas.slice(ctaIndex + 1).filter((p) => !p.querySelector('a')).pop()
      : null;
    if (note) note.classList.add('tabs-feature-note');

    const mediaPara = content.querySelector('.tabs-feature-media');
    if (mediaPara) panel.append(mediaPara);
  });
}

/**
 * Scope: .ai-tabs non-toggle only. Tags the panel eyebrow as a mobile
 * accordion control that activates the matching tab (desktop tablist stays).
 */
function enhanceAiTabs(block) {
  block.querySelectorAll('.tabs-feature-panel').forEach((panel) => {
    const content = panel.querySelector(':scope > div');
    if (!content) return;
    const label = [...content.querySelectorAll(':scope > p')]
      .find((p) => !p.classList.contains('tabs-feature-media') && !p.classList.contains('tabs-feature-cta'));
    if (!label) return;

    label.classList.add('tabs-feature-label');
    label.setAttribute('role', 'button');
    label.tabIndex = 0;

    const activate = () => {
      const tab = block.querySelector(`[aria-controls="${panel.id}"]`);
      if (tab) tab.click();
    };
    label.addEventListener('click', activate);
    label.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      activate();
    });
  });
}

/**
 * Insights-tabs variation — match production .parts-forecaster layout.
 * Live panels are: h3 (category link) → h4 → description → CTA → image.
 * Authors often store the h3 as a plain <p><a> before the h4; decorateDefault
 * may mis-tag that as the CTA. Reclassify here, promote to <h3>, and move
 * media to the panel root so CSS can absolutely position it.
 */
function decorateInsightsTabs(block) {
  block.querySelectorAll('.tabs-feature-panel').forEach((panel) => {
    const content = panel.firstElementChild;
    if (!content) return;

    const h4 = content.querySelector(':scope > h4');
    const paras = [...content.querySelectorAll(':scope > p')];

    // First link before the h4 is the category (live .item > h3 > a), not the CTA.
    const children = [...content.children];
    const h4Index = h4 ? children.indexOf(h4) : -1;
    const categoryPara = paras.find((p) => {
      if (!p.querySelector('a')) return false;
      if (h4Index < 0) return true;
      return children.indexOf(p) < h4Index;
    });

    // Drop any prior mis-tags so we can re-apply cleanly.
    paras.forEach((p) => {
      p.classList.remove('tabs-feature-category', 'tabs-feature-cta', 'tabs-feature-note');
    });

    let category = content.querySelector(':scope > h3.tabs-feature-category');
    if (categoryPara) {
      const link = categoryPara.querySelector('a');
      if (link) {
        link.classList.remove('button', 'primary');
        categoryPara.classList.remove('button-wrapper');
      }
      if (category) {
        // Prefer authored link; replace the plain injected label.
        category.replaceWith(categoryPara);
      }
      categoryPara.classList.add('tabs-feature-category');
      // Promote <p> to <h3> to match live semantics + CSS.
      const h3 = document.createElement('h3');
      h3.className = 'tabs-feature-category';
      h3.append(...categoryPara.childNodes);
      categoryPara.replaceWith(h3);
      category = h3;
    } else if (!category) {
      const button = block.querySelector(`[aria-controls="${panel.id}"]`);
      if (button) {
        const h3 = document.createElement('h3');
        h3.className = 'tabs-feature-category';
        h3.textContent = button.textContent.trim();
        content.prepend(h3);
        category = h3;
      }
    }

    // Real CTA = remaining link paragraph (e.g. "Start your journey").
    const cta = paras.find((p) => (
      p.isConnected
      && !p.classList.contains('tabs-feature-media')
      && p.querySelector('a')
      && p !== categoryPara
    ));
    if (cta) cta.classList.add('tabs-feature-cta');

    // Move media to panel level for the overlapping card layout.
    const mediaPara = content.querySelector('.tabs-feature-media');
    if (mediaPara) panel.append(mediaPara);
  });
}

export default async function decorate(block) {
  if (block.classList.contains('toggle')) {
    decorateToggle(block);
    return;
  }
  decorateDefault(block);
  // AI page Foresight switcher only — mobile accordion labels; no-op elsewhere.
  if (block.closest('.ai-tabs')) enhanceAiTabs(block);
  // Homepage feature switcher — match production #feature-container.
  // decorateFeatureTabs adds .homepage to the section; nav arrows are appended
  // after so they can be gated on .section.feature-tabs.homepage.
  if (block.closest('.section.feature-tabs')) decorateFeatureTabs(block);
  if (block.closest('.section.feature-tabs.homepage')) {
    decorateMobileDropdown(block);
    const tablist = block.querySelector('[role="tablist"]');
    const nav = document.createElement('div');
    nav.className = 'tabs-feature-nav';
    const makeArrow = (label, direction) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = direction === -1 ? 'slide-prev' : 'slide-next';
      btn.setAttribute('aria-label', label);
      btn.addEventListener('click', () => {
        const btns = [...tablist.querySelectorAll('button')];
        const active = btns.findIndex((b) => b.getAttribute('aria-selected') === 'true');
        btns[(active + direction + btns.length) % btns.length].click();
      });
      return btn;
    };
    nav.append(makeArrow('Previous', -1), makeArrow('Next', 1));
    block.append(nav);
  }
  // Homepage insights-tabs only — match production .parts-forecaster layout.
  if (block.closest('.section.insights-tabs.homepage')) {
    decorateInsightsTabs(block);
    decorateMobileDropdown(block);
  }
}
