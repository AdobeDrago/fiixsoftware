import { loadScript } from '../../scripts/aem.js';

const VIDYARD_HOSTNAME = 'play.vidyard.com';
const VIDYARD_SCRIPT = `https://${VIDYARD_HOSTNAME}/embed/v4.js`;
const VIDYARD_UUID_PATTERN = /^[A-Za-z0-9_-]+$/;
const AUTOPLAY_CONFIG_KEY = 'autoplay';
const POSTER_CONFIG_KEY = 'poster';

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

function getConfigRow(block, key) {
  return [...block.children].find((row) => {
    const [label] = row.children;
    return label?.textContent.trim().toLowerCase() === key;
  });
}

function getVideoUuid(block) {
  const link = [...block.querySelectorAll('a[href]')].find((anchor) => {
    try {
      const url = new URL(anchor.href);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const [uuid] = pathSegments;
      return (
        url.protocol === 'https:'
        && url.hostname === VIDYARD_HOSTNAME
        && pathSegments.length === 1
        && VIDYARD_UUID_PATTERN.test(uuid)
      );
    } catch {
      return false;
    }
  });
  if (!link) return null;

  try {
    const url = new URL(link.href);
    return url.pathname.split('/').filter(Boolean)[0];
  } catch {
    return null;
  }
}

function isAutoplayEnabled(block) {
  const autoplayRow = getConfigRow(block, AUTOPLAY_CONFIG_KEY);
  if (!autoplayRow) return false;

  const value = autoplayRow.children[1]?.textContent.trim().toLowerCase();
  return value === 'true';
}

function getPosterMedia(block, uuid) {
  const posterRow = getConfigRow(block, POSTER_CONFIG_KEY);
  if (posterRow) {
    const valueCell = posterRow.children[1] || posterRow.children[0];
    const picture = valueCell?.querySelector('picture');
    if (picture) return picture.cloneNode(true);

    const image = valueCell?.querySelector('img');
    if (image) return image.cloneNode(true);

    const link = valueCell?.querySelector('a[href]');
    if (link) {
      const linkedImage = document.createElement('img');
      linkedImage.src = link.href;
      linkedImage.alt = link.textContent.trim() || 'Video poster';
      linkedImage.loading = 'lazy';
      linkedImage.decoding = 'async';
      return linkedImage;
    }
  }

  const fallback = document.createElement('img');
  fallback.src = `https://${VIDYARD_HOSTNAME}/${uuid}.jpg`;
  fallback.alt = 'Video poster';
  fallback.loading = 'lazy';
  fallback.decoding = 'async';
  return fallback;
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

function createLightboxEmbed(uuid) {
  const hideWrap = document.createElement('div');
  hideWrap.className = 'vidyard-video-player-embed-hide';

  const embed = document.createElement('div');
  embed.className = 'vidyard-player-embed';
  embed.dataset.uuid = uuid;
  embed.dataset.v = '4';
  embed.dataset.type = 'lightbox';
  hideWrap.append(embed);
  return { hideWrap, embed };
}

function getVidyardPlayer(uuid) {
  return window.VidyardV4?.api?.getPlayersByUUID?.(uuid)?.[0]
    || window.vidyardEmbed?.api?.getPlayersByUUID?.(uuid)?.[0];
}

async function openLightbox(uuid, embed) {
  await loadVidyardScript();
  if (embed.isConnected && embed.dataset.rendered !== 'true') {
    window.vidyardEmbed?.api?.renderPlayer?.(embed);
  }
  getVidyardPlayer(uuid)?.showLightbox();
}

/**
 * Popover variation: authored poster + centered play control opens the
 * Vidyard URL in a lightbox (same showLightbox path as cards-video).
 * @param {Element} block
 * @param {string} uuid
 */
function decoratePopover(block, uuid) {
  const poster = getPosterMedia(block, uuid);
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'vidyard-video-player-poster';
  trigger.setAttribute('aria-label', 'Play video');

  const media = document.createElement('span');
  media.className = 'vidyard-video-player-poster-media';
  media.append(poster);

  const play = document.createElement('span');
  play.className = 'vidyard-video-player-play';
  play.setAttribute('aria-hidden', 'true');

  trigger.append(media, play);

  const { hideWrap, embed } = createLightboxEmbed(uuid);
  block.replaceChildren(trigger, hideWrap);

  trigger.addEventListener('click', () => {
    openLightbox(uuid, embed);
  });
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
 * Default: inline embed. Variation `popover`: poster + play opens lightbox.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  decorateCaseStudyExternalLinks(block);

  const uuid = getVideoUuid(block);
  if (!uuid) return;

  if (block.classList.contains('popover')) {
    decoratePopover(block, uuid);
    return;
  }

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
