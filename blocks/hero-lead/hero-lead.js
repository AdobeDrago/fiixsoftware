/** Matches the project's desktop breakpoint (also where the nav switches off the hamburger). */
const DESKTOP_MEDIA_QUERY = '(min-width: 960px)';

/**
 * Builds the autoplay <video> (muted + looping), using the screenshot as its
 * poster and graceful fallback content.
 * @param {Element} picture the screenshot to use as poster/fallback
 * @param {string} href the hero .mp4 URL
 * @returns {HTMLVideoElement}
 */
function buildHeroVideo(picture, href) {
  const posterImg = picture.querySelector('img');
  const video = document.createElement('video');
  video.className = 'hero-lead-video';
  video.muted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  if (posterImg && posterImg.src) video.setAttribute('poster', posterImg.src);

  const source = document.createElement('source');
  source.setAttribute('src', href);
  source.setAttribute('type', 'video/mp4');
  video.append(source);

  // Keep the screenshot as graceful fallback inside the <video>.
  video.append(picture.cloneNode(true));
  return video;
}

/**
 * `video` variant (free-cmms split hero): the media cell carries the product
 * screenshot and, when present, a link to the hero .mp4. Production autoplays
 * that video — muted + looping — only on desktop, where it has its own
 * dedicated panel; mobile/tablet show the static screenshot only, since that
 * layout is a cropped full-bleed band rather than room for a showcase video,
 * and there's no reason to spend a video download on smaller/slower
 * connections for it. Re-evaluated on resize so rotating a tablet or resizing
 * the window across the breakpoint swaps the right media in. This runs only
 * for the `video` variant; the standard lead hero uses a plain image.
 * @param {Element} mediaCell the block's media cell
 */
function decorateVideoVariant(mediaCell) {
  if (!mediaCell) return;
  const picture = mediaCell.querySelector('picture');
  const videoLink = mediaCell.querySelector('a[href*=".mp4"]');
  if (!picture || !videoLink) return;

  const href = videoLink.getAttribute('href');

  // aem.js's wrapTextNodes() wraps this column's picture + link pair in a <p>
  // (it always runs here, since the column has 2+ children). Replace that
  // wrapper outright so the picture/video lands as a direct flex child of the
  // media cell -- left nested in the <p>, it's a flex item with
  // flex-basis: auto, so it shrinks to fit its own content instead of
  // filling the panel.
  const wrapper = picture.parentElement !== mediaCell ? picture.parentElement : picture;
  wrapper.replaceWith(picture);
  videoLink.remove();

  const desktopQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
  let current = picture;

  const syncMedia = () => {
    if (desktopQuery.matches && current === picture) {
      const video = buildHeroVideo(picture, href);
      current.replaceWith(video);
      current = video;
      // Some browsers ignore the autoplay attribute until play() is called.
      const tryPlay = video.play();
      if (tryPlay && typeof tryPlay.catch === 'function') tryPlay.catch(() => {});
    } else if (!desktopQuery.matches && current !== picture) {
      current.replaceWith(picture);
      current = picture;
    }
  };

  syncMedia();
  desktopQuery.addEventListener('change', syncMedia);
}

export default function decorate(block) {
  const rows = [...block.children];

  // First row cell = image, second row cell = content (per authored structure).
  const imageCell = rows[0]?.firstElementChild;
  const contentCell = rows[1]?.firstElementChild;

  if (imageCell) imageCell.classList.add('hero-lead-media');

  // `video` variant: rebuild the autoplay video panel; skip the home hero's
  // form + stat-metric parsing below (that content doesn't exist here).
  if (block.classList.contains('video')) {
    decorateVideoVariant(imageCell);
    return;
  }

  if (!contentCell) {
    if (!block.querySelector(':scope > div:first-child picture')) {
      block.classList.add('no-image');
    }
    return;
  }

  contentCell.classList.add('hero-lead-content');

  const paragraphs = [...contentCell.querySelectorAll(':scope > p')];

  // 1. Email-capture form: the paragraph reads as
  //    "Company email  Try it for free →". Identify it by content (not position)
  //    — the homepage has it first, but product pages lead with an intro
  //    paragraph, so a positional [0] would wrongly consume the intro copy.
  const formPara = paragraphs.find(
    (p) => !p.querySelector('a') && /try it for free/i.test(p.textContent),
  );
  if (formPara) {
    const raw = formPara.textContent.trim();
    // Everything up to the button call-to-action is the field placeholder.
    const ctaMatch = raw.match(/(Try it for free.*)$/i);
    const cta = ctaMatch ? ctaMatch[1].trim() : 'Try it for free →';
    const placeholder = ctaMatch ? raw.slice(0, ctaMatch.index).trim() : raw;

    const form = document.createElement('div');
    form.className = 'hero-lead-form';

    const input = document.createElement('input');
    input.type = 'email';
    input.className = 'hero-lead-input';
    input.setAttribute('aria-label', placeholder || 'Email');
    input.placeholder = placeholder;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hero-lead-cta';
    button.textContent = cta;

    form.append(input, button);
    formPara.replaceWith(form);
  }

  // 2. Supporting line: paragraph that introduces the stat metrics.
  const support = [...contentCell.querySelectorAll(':scope > p')]
    .find((p) => !p.querySelector('a') && !p.querySelector('strong')
      && !/^\s*(down(ward)?\s*arrow)\s*$/i.test(p.textContent));
  if (support) support.classList.add('hero-lead-support');

  // 3. Stat metrics: pairs of [arrow paragraph, "... <strong>NN%</strong>" paragraph].
  const remaining = [...contentCell.querySelectorAll(':scope > p')];
  const arrowParas = remaining.filter((p) => /^\s*down(ward)?\s*arrow\s*$/i.test(p.textContent));

  if (arrowParas.length) {
    const stats = document.createElement('div');
    stats.className = 'hero-lead-stats';

    arrowParas.forEach((arrowPara) => {
      const statPara = arrowPara.nextElementSibling;
      if (!statPara || statPara.tagName !== 'P') return;

      const item = document.createElement('div');
      item.className = 'hero-lead-stat';

      const icon = document.createElement('span');
      icon.className = 'hero-lead-stat-arrow';
      icon.setAttribute('aria-hidden', 'true');

      const label = document.createElement('p');
      label.className = 'hero-lead-stat-label';
      // preserve authored content, including the <strong> percentage
      while (statPara.firstChild) label.appendChild(statPara.firstChild);

      item.append(icon, label);
      stats.append(item);

      arrowPara.remove();
      statPara.remove();
    });

    contentCell.append(stats);
  }
}
