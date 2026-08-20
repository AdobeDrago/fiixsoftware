import { loadScript } from '../../scripts/aem.js';

const VIDYARD_HOSTNAME = 'play.vidyard.com';
const VIDYARD_SCRIPT = `https://${VIDYARD_HOSTNAME}/embed/v4.js`;
const VIDYARD_UUID_PATTERN = /^[A-Za-z0-9_-]+$/;

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

function getVidyardUuid(href) {
  if (!href) return null;

  try {
    const url = new URL(href);
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

function createPlayerPlaceholder(uuid) {
  const image = document.createElement('img');
  image.className = 'vidyard-player-embed';
  image.src = `https://${VIDYARD_HOSTNAME}/${uuid}.jpg`;
  image.alt = 'Vidyard video player';
  image.loading = 'lazy';
  image.decoding = 'async';
  image.dataset.uuid = uuid;
  image.dataset.v = '4';
  image.dataset.type = 'inline';
  return image;
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Media cell is a Vidyard URL only (optionally wrapped by wrapTextNodes in a
 * paragraph). Text columns with headings/body copy are ignored.
 */
function isVidyardMediaColumn(col) {
  if (col.querySelector('picture')) return false;

  const link = col.querySelector(`a[href*="${VIDYARD_HOSTNAME}"]`);
  if (!link || !getVidyardUuid(link.href)) return false;

  const columnText = normalizeText(col.textContent);
  const linkText = normalizeText(link.textContent);
  const href = link.getAttribute('href') || '';

  return columnText === linkText
    || columnText === normalizeText(link.href)
    || columnText === normalizeText(href);
}

function renderPlaceholders(placeholders) {
  placeholders.forEach((placeholder) => {
    if (!placeholder.isConnected || placeholder.dataset.rendered === 'true') return;
    window.vidyardEmbed?.api?.renderPlayer(placeholder);
  });
}

async function decorateVidyard(block) {
  if (!block.classList.contains('vidyard')) return;

  const placeholders = [];

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      if (!isVidyardMediaColumn(col)) return;

      const link = col.querySelector(`a[href*="${VIDYARD_HOSTNAME}"]`);
      const uuid = getVidyardUuid(link.href);
      if (!uuid) return;

      const placeholder = createPlayerPlaceholder(uuid);
      col.replaceChildren(placeholder);
      col.classList.add('columns-media-img-col');
      placeholders.push(placeholder);
    });
  });

  if (!placeholders.length) return;

  try {
    await loadVidyardScript();
    renderPlaceholders(placeholders);

    // Script may already be on the page (e.g. cards-video). Give the API a
    // tick to attach before a second render pass for any unrendered embeds.
    if (placeholders.some((placeholder) => placeholder.isConnected
      && placeholder.dataset.rendered !== 'true')) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 0);
      });
      renderPlaceholders(placeholders);
    }
  } catch {
    // Keep the thumbnail placeholders if the Vidyard script fails to load.
  }
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-media-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-media-img-col');
        }
      }
    });
  });

  // Connect-users hero: production renders this as a full-width grey band whose
  // image is a fixed (parallax) background, with the text in a white card that
  // overlaps it. Move the authored image to a CSS background variable (so the
  // authored asset — once corrected in DA — drives the background) and tag the
  // band + text card. Scoped to .connect-users; other columns-media are untouched.
  if (block.closest('.connect-users')) {
    // The image may be authored inside the block OR as a separate content block
    // in the same section, so search the whole section for it.
    const section = block.closest('.connect-users');
    const img = section.querySelector('img');
    if (img) {
      // Request a large render of the image so the background fills the band
      // like production (which uses a 1522px-wide asset). The default optimized
      // src is only 750px wide, which rendered the 3D scene at half size.
      const raw = img.getAttribute('src') || img.src;
      const large = raw.replace(/width=\d+/, 'width=1600');
      block.style.setProperty('--connect-media', `url("${large}")`);
      block.classList.add('columns-media-parallax');
      // The text column becomes the white card; empty (image) columns are dropped.
      const row = block.firstElementChild;
      [...row.children].forEach((col) => {
        if (col.textContent.trim() === '' && !col.querySelector('img')) col.remove();
        else col.classList.add('columns-media-card');
      });
      // Remove the standalone image wrapper now that it drives the background.
      const wrap = img.closest('.default-content-wrapper') || img.closest('picture');
      if (wrap && !block.contains(wrap)) wrap.remove();
    }
  }

  // info-flex: text column is the white card; media column stays .columns-media-img-col.
  // Scoped so default / vidyard / connect-users columns-media are untouched.
  if (block.classList.contains('info-flex')) {
    [...block.children].forEach((row) => {
      [...row.children].forEach((col) => {
        if (!col.classList.contains('columns-media-img-col')) {
          col.classList.add('columns-media-info-text');
        }
      });
    });
  }

  await decorateVidyard(block);
}
