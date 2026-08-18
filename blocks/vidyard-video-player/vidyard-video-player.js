import { loadScript } from '../../scripts/aem.js';

const VIDYARD_HOSTNAME = 'play.vidyard.com';
const VIDYARD_SCRIPT = `https://${VIDYARD_HOSTNAME}/embed/v4.js`;
const VIDYARD_UUID_PATTERN = /^[A-Za-z0-9_-]+$/;
const AUTOPLAY_CONFIG_KEY = 'autoplay';

let vidyardScriptPromise;

function loadVidyardScript() {
  if (!vidyardScriptPromise) {
    vidyardScriptPromise = loadScript(VIDYARD_SCRIPT, { async: '' }).catch((error) => {
      vidyardScriptPromise = undefined;
      throw error;
    });
  }
  return vidyardScriptPromise;
}

function getVideoUuid(block) {
  const link = block.querySelector('a[href]');
  if (!link) return null;

  try {
    const url = new URL(link.href);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const [uuid] = pathSegments;

    if (
      url.protocol !== 'https:'
      || url.hostname !== VIDYARD_HOSTNAME
      || pathSegments.length !== 1
      || !VIDYARD_UUID_PATTERN.test(uuid)
    ) return null;

    return uuid;
  } catch {
    return null;
  }
}

function isAutoplayEnabled(block) {
  const autoplayRow = [...block.children].find((row) => {
    const [key] = row.children;
    return key?.textContent.trim().toLowerCase() === AUTOPLAY_CONFIG_KEY;
  });
  if (!autoplayRow) return false;

  const value = autoplayRow.children[1]?.textContent.trim().toLowerCase();
  return value === 'true';
}

function createPlayerPlaceholder(uuid, autoplay) {
  const image = document.createElement('img');
  image.className = 'vidyard-player-embed';
  image.src = `https://${VIDYARD_HOSTNAME}/${uuid}.jpg`;
  image.alt = 'Vidyard video player';
  image.loading = 'lazy';
  image.decoding = 'async';
  image.dataset.uuid = uuid;
  image.dataset.v = '4';
  image.dataset.type = 'inline';
  if (autoplay) {
    image.dataset.autoplay = '1';
    image.dataset.muted = '1';
  }
  return image;
}

function decorateCaseStudyExternalLinks(block) {
  if (!document.querySelector('.hero-case-study')) return;

  const section = block.closest('.vidyard-video-player-container');
  if (!section) return;

  section.querySelectorAll('.default-content-wrapper a[href]').forEach((link) => {
    let url;
    try {
      url = new URL(link.href);
    } catch {
      return;
    }
    if (url.origin === window.location.origin) return;

    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.classList.add('vidyard-video-player-external-link');

    const annotation = link.nextSibling;
    if (annotation?.nodeType === Node.TEXT_NODE) {
      annotation.textContent = annotation.textContent
        .replace(/^\s*\(opens in new tab\)\s*/i, ' ');
    }

    if (!link.querySelector('.vidyard-video-player-new-tab')) {
      const announcement = document.createElement('span');
      announcement.className = 'vidyard-video-player-new-tab';
      announcement.textContent = ' (opens in new tab)';
      link.append(announcement);
    }
  });
}

/**
 * Loads and decorates a Vidyard video player block.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  decorateCaseStudyExternalLinks(block);

  const uuid = getVideoUuid(block);
  if (!uuid) return;

  const autoplay = isAutoplayEnabled(block);
  const fallback = block.cloneNode(true);
  const placeholder = createPlayerPlaceholder(uuid, autoplay);
  block.replaceChildren(placeholder);

  try {
    await loadVidyardScript();

    if (placeholder.isConnected && placeholder.dataset.rendered !== 'true') {
      window.vidyardEmbed?.api?.renderPlayer(placeholder);
    }
  } catch {
    block.replaceChildren(...fallback.childNodes);
  }
}
