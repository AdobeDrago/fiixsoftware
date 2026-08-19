const VIDEO_LINK_SELECTOR = 'a[href$=".mp4" i], a[href$=".webm" i]';

/**
 * Checks whether a row supplies a gallery slide.
 *
 * @param {Element} row an authored block row
 * @returns {boolean} whether the row contains image or video media
 */
function isMediaRow(row) {
  return Boolean(row.querySelector(`picture, img, ${VIDEO_LINK_SELECTOR}`));
}

/**
 * Finds a direct video link authored in a slide row.
 *
 * @param {Element} row an authored block row
 * @returns {HTMLAnchorElement | null} the video link, if present
 */
function getVideoLink(row) {
  return row.querySelector(VIDEO_LINK_SELECTOR);
}

/**
 * Returns the index of the slide nearest the start of the scroll track.
 *
 * @param {HTMLElement} track the carousel track
 * @param {HTMLElement[]} slides carousel slides
 * @returns {number} active slide index
 */
function getActiveSlideIndex(track, slides) {
  return slides.reduce((closestIndex, slide, index) => {
    const closestOffset = slides[closestIndex].offsetLeft - track.offsetLeft;
    const closestDistance = Math.abs(closestOffset - track.scrollLeft);
    const distance = Math.abs(slide.offsetLeft - track.offsetLeft - track.scrollLeft);
    return distance < closestDistance ? index : closestIndex;
  }, 0);
}

/**
 * Creates controls for a multi-slide carousel.
 *
 * @param {HTMLElement} track the carousel track
 * @param {HTMLElement[]} slides carousel slides
 * @returns {HTMLElement} navigation controls
 */
function createNavigation(track, slides) {
  const navigation = document.createElement('nav');
  navigation.className = 'carousel-case-study-navigation';
  navigation.setAttribute('aria-label', 'Case study gallery controls');

  const previous = document.createElement('button');
  previous.className = 'carousel-case-study-previous';
  previous.type = 'button';
  previous.setAttribute('aria-label', 'Previous image');

  const dots = document.createElement('div');
  dots.className = 'carousel-case-study-dots';

  const next = document.createElement('button');
  next.className = 'carousel-case-study-next';
  next.type = 'button';
  next.setAttribute('aria-label', 'Next image');

  const dotButtons = slides.map((slide, index) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-case-study-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show image ${index + 1} of ${slides.length}`);
    dot.addEventListener('click', () => {
      track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    });
    dots.append(dot);
    return dot;
  });

  const updateNavigation = () => {
    const activeIndex = getActiveSlideIndex(track, slides);
    dotButtons.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  };

  const moveSlide = (direction) => {
    const activeIndex = getActiveSlideIndex(track, slides);
    const targetIndex = (activeIndex + direction + slides.length) % slides.length;
    const isBoundary = (direction < 0 && activeIndex === 0)
      || (direction > 0 && activeIndex === slides.length - 1);
    const left = slides[targetIndex].offsetLeft - track.offsetLeft;
    if (isBoundary) track.scrollLeft = left;
    else track.scrollTo({ left, behavior: 'smooth' });
  };

  previous.addEventListener('click', () => moveSlide(-1));
  next.addEventListener('click', () => moveSlide(1));

  let scrollFrame;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(updateNavigation);
  }, { passive: true });

  const resizeObserver = new ResizeObserver(updateNavigation);
  resizeObserver.observe(track);
  updateNavigation();

  navigation.append(previous, dots, next);
  return navigation;
}

/**
 * Decorates a captioned image and video carousel for case-study pages.
 *
 * Author the optional caption in the first row, then add one image (or a
 * direct .mp4/.webm link) per row for each slide.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const firstMediaIndex = rows.findIndex(isMediaRow);
  if (firstMediaIndex < 0) return;

  const captionRows = rows.slice(0, firstMediaIndex);
  const mediaRows = rows.slice(firstMediaIndex);
  const caption = document.createElement('div');
  caption.className = 'carousel-case-study-caption';
  captionRows.forEach((row) => caption.append(...row.childNodes));

  const track = document.createElement('ul');
  track.className = 'carousel-case-study-track';
  track.setAttribute('aria-label', 'Case study image gallery');

  const slides = mediaRows.map((row, index) => {
    const slide = document.createElement('li');
    slide.className = 'carousel-case-study-slide';
    const figure = document.createElement('figure');
    const videoLink = getVideoLink(row);
    if (videoLink) {
      const video = document.createElement('video');
      const authoredLabel = videoLink.textContent.trim();
      video.controls = true;
      video.preload = 'metadata';
      video.setAttribute(
        'aria-label',
        authoredLabel && authoredLabel !== videoLink.href ? authoredLabel : `Case study video ${index + 1}`,
      );
      const source = document.createElement('source');
      source.src = videoLink.href;
      source.type = videoLink.href.toLowerCase().includes('.webm') ? 'video/webm' : 'video/mp4';
      video.append(source);
      figure.append(video);
    } else {
      figure.append(...row.childNodes);
    }
    slide.append(figure);
    return slide;
  });
  track.append(...slides);

  block.replaceChildren();
  if (caption.hasChildNodes()) block.append(caption);
  block.append(track);
  if (slides.length > 1) block.append(createNavigation(track, slides));
}
