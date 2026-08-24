import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Finds the embed URL authored in a column, either as a link or as bare text.
 * @param {Element} col A block column
 * @returns {string|null} The URL, if the column holds one
 */
function findEmbedUrl(col) {
  const link = col.querySelector('a[href]');
  const text = (link ? link.getAttribute('href') : col.textContent).trim();

  try {
    const url = new URL(text);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
  } catch {
    // not a URL
  }
  return null;
}

/**
 * Replaces authored pictures in a container with an optimized version.
 * @param {Element} container A block row or column
 */
function optimizePictures(container) {
  container.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  let title = '';
  let headingEl = null;
  let mediaRowCount = 0;
  // Wraps the authored rows so they can be centered/laid out as a unit,
  // independent of the block's own full-bleed background band.
  const inner = document.createElement('div');
  inner.className = 'iframe-card-inner';

  [...block.children].forEach((row) => {
    const cols = [...row.children];
    const embedCol = cols.find((col) => findEmbedUrl(col));

    if (embedCol) {
      row.classList.add('iframe-card-row');
      const mediaCol = cols.find((col) => col !== embedCol);
      if (mediaCol) {
        mediaCol.classList.add('iframe-card-media');
        optimizePictures(mediaCol);
      }

      embedCol.classList.add('iframe-card-embed');
      const src = findEmbedUrl(embedCol);
      if (src) {
        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.title = title || 'Product tour';
        iframe.loading = 'lazy';
        iframe.allow = 'fullscreen';
        iframe.allowFullscreen = true;
        embedCol.replaceChildren(iframe);
      }

      inner.append(row);
      return;
    }

    // No embed URL: either a decorative-image-only row (authored separately
    // from the embed row) or the heading row (text, optionally with an
    // inline image). Either way it stays out of iframe-card-row.
    const hasText = row.textContent.trim() !== '';
    const hasPicture = row.querySelector('picture');

    if (hasPicture && !hasText) {
      optimizePictures(row);
      mediaRowCount += 1;

      if (mediaRowCount === 1 || !headingEl) {
        // First decorative image (or none authored yet): the background
        // shapes graphic, bled independently near the top of the card.
        row.classList.add('iframe-card-media');
        inner.append(row);
      } else {
        // A second decorative image is the connecting arrow. Move it inside
        // the heading itself, in normal flow, so it always sits directly
        // below the heading text regardless of how tall the embed makes the
        // row (avoids computing an absolute position that would have to
        // track the heading's own, flex-centered vertical position).
        const arrowCol = row.firstElementChild;
        arrowCol.classList.add('iframe-card-arrow');
        headingEl.append(arrowCol);
      }
      return;
    }

    row.classList.add('iframe-card-heading');
    title = row.textContent.trim();
    optimizePictures(row);
    headingEl = row;
    inner.append(row);
  });

  block.append(inner);
}
