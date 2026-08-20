// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';

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
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
      // start the newly shown panel's video (deferred tabs preload="none")
      const video = tabpanel.querySelector('video');
      if (video) {
        const play = video.play();
        if (play && typeof play.catch === 'function') play.catch(() => {});
      }
    });
    tablist.append(button);
    tab.remove();

    // tag panel content for styling hooks (no behavioral change):
    // the media paragraph (screenshot/video) vs. the trailing stat/quote note
    const content = tabpanel.firstElementChild;
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

export default async function decorate(block) {
  if (block.classList.contains('toggle')) {
    decorateToggle(block);
    return;
  }
  decorateDefault(block);
  // AI page Foresight switcher only — mobile accordion labels; no-op elsewhere.
  if (block.closest('.ai-tabs')) enhanceAiTabs(block);
}
