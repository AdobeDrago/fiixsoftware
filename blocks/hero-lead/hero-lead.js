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
 * Swaps the media cell's screenshot for an autoplay video, desktop only
 * (mobile/tablet keep the static screenshot to save bandwidth). Re-evaluated
 * on resize. Shared by the `video-without-form` and `video-with-form` variants.
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

/**
 * Layers a media cell that has more than one picture (hero screenshot +
 * decorative shape/accent graphics, e.g. the mobile-cmms app promo) and tags
 * the app-store badge row, if present, for its own layout. No-ops when the
 * media cell only has the usual single screenshot.
 * @param {Element} mediaCell the block's media cell
 */
function decorateMediaLayers(mediaCell) {
  if (!mediaCell) return;
  const pictures = [...mediaCell.querySelectorAll('picture')];
  if (pictures.length < 2) return;

  const badgePictures = pictures.filter((p) => {
    const link = p.closest('a');
    return link && /apps\.apple\.com|play\.google\.com/.test(link.href);
  });
  const badgesPara = badgePictures[0]?.closest('p');
  if (badgesPara) badgesPara.classList.add('hero-lead-app-badges');

  const layered = pictures.filter((p) => !badgePictures.includes(p));
  if (layered.length < 2) return;

  const [hero, ...decorations] = layered;
  hero.classList.add('hero-lead-media-hero');
  // biggest of the rest is the background shape; anything smaller is a small accent
  decorations.sort((a, b) => (Number(b.querySelector('img')?.getAttribute('width')) || 0)
    - (Number(a.querySelector('img')?.getAttribute('width')) || 0));
  const [shape, ...accents] = decorations;
  shape.classList.add('hero-lead-media-shape');
  accents.forEach((p) => p.classList.add('hero-lead-media-accent'));

  const heroPara = hero.closest('p');
  if (!heroPara) return;
  heroPara.classList.add('hero-lead-media-layers');

  const mediaContent = document.createElement('div');
  mediaContent.className = 'hero-lead-media-content';

  // Move the trailing caption text (e.g. "Available on iOS and Android") out
  // to its own element after the layered picture group -- left inside, its
  // height would count towards the positioning box the shape/accent
  // percentages are relative to, throwing off their placement.
  [...heroPara.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
    .forEach((n) => {
      const span = document.createElement('span');
      span.className = 'hero-lead-app-caption';
      span.textContent = n.textContent.trim();
      n.remove();
      mediaContent.append(span);
    });

  if (badgesPara) mediaContent.append(badgesPara);

  if (mediaContent.childNodes.length) heroPara.after(mediaContent);
}

export default function decorate(block) {
  const rows = [...block.children];

  // First row cell = image, second row cell = content (per authored structure).
  const imageCell = rows[0]?.firstElementChild;
  const contentCell = rows[1]?.firstElementChild;

  if (imageCell) {
    imageCell.classList.add('hero-lead-media');
    decorateMediaLayers(imageCell);
  }

  // video only, no form/stats content
  if (block.classList.contains('video-without-form')) {
    decorateVideoVariant(imageCell);
    const cta = contentCell?.querySelector('a');
    if (cta?.parentElement?.tagName === 'P') {
      cta.parentElement.classList.add('button-container');
    }
    return;
  }

  // video + the standard form/stats content decorated below
  if (block.classList.contains('video-with-form')) {
    decorateVideoVariant(imageCell);
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

  const mediaContent = block.querySelector('.hero-lead-media-content');
  if (mediaContent) contentCell.append(mediaContent);
}
