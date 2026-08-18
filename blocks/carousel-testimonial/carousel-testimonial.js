/**
 * Distance to scroll for a single item step: one card width + the flex gap.
 * @param {Element} block the carousel block
 * @returns {number} pixels to scroll to advance/retreat by exactly one card
 */
function getSlideStep(block) {
  const slides = block.querySelector('.carousel-testimonial-slides');
  const slide = slides.querySelector('.carousel-testimonial-slide');
  if (!slide) return 0;
  const gap = parseFloat(getComputedStyle(slides).columnGap) || 0;
  return slide.getBoundingClientRect().width + gap;
}

/**
 * Enable/disable the prev/next controls based on the current scroll position
 * so the user can't page past either end.
 * @param {Element} block the carousel block
 */
function updateNavState(block) {
  const slides = block.querySelector('.carousel-testimonial-slides');
  const prev = block.querySelector('.slide-prev');
  const next = block.querySelector('.slide-next');
  if (!prev || !next) return;
  // Scroll snapping aligns the first slide's edge with the snapport, so at rest
  // scrollLeft sits at the track's inline padding rather than 0.
  const tolerance = parseFloat(getComputedStyle(slides).paddingInlineStart) + 1;
  const maxScroll = slides.scrollWidth - slides.clientWidth;
  prev.disabled = slides.scrollLeft <= tolerance;
  next.disabled = slides.scrollLeft >= maxScroll - tolerance;

  // Sync dot indicators (visible in the `quote` variant) with the current slide.
  const indicators = [...block.querySelectorAll('.carousel-testimonial-slide-indicator')];
  if (indicators.length) {
    const step = getSlideStep(block) || slides.clientWidth || 1;
    const current = Math.round(slides.scrollLeft / step);
    indicators.forEach((li, i) => li.setAttribute('aria-selected', i === current ? 'true' : 'false'));
  }
}

/**
 * Scroll the track by one card in the given direction.
 * @param {Element} block the carousel block
 * @param {number} direction -1 for previous, 1 for next
 */
export function showSlide(block, direction = 1) {
  const slides = block.querySelector('.carousel-testimonial-slides');
  slides.scrollBy({ top: 0, left: getSlideStep(block) * direction, behavior: 'smooth' });
}

function bindEvents(block) {
  const slides = block.querySelector('.carousel-testimonial-slides');

  block.querySelector('.slide-prev').addEventListener('click', () => showSlide(block, -1));
  block.querySelector('.slide-next').addEventListener('click', () => showSlide(block, 1));

  // Dot indicators (quote variant): clicking one scrolls to that slide.
  block.querySelectorAll('.carousel-testimonial-slide-indicator button').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      slides.scrollTo({ left: getSlideStep(block) * idx, behavior: 'smooth' });
    });
  });

  let scrollRaf;
  slides.addEventListener('scroll', () => {
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => updateNavState(block));
  }, { passive: true });

  // Recompute on any track resize -- this also covers the case where the block
  // is decorated before it has a measurable width (e.g. still below the fold),
  // which would otherwise leave the controls incorrectly disabled.
  const resizeObserver = new ResizeObserver(() => updateNavState(block));
  resizeObserver.observe(slides);

  updateNavState(block);
}

/**
 * Adds styling hooks so the author (headshot + name/role) and company logo
 * render as a card footer. Purely structural regrouping for CSS -- it does not
 * read new content or alter carousel rotation logic.
 * @param {Element} slide the decorated slide (li)
 */
function decorateTestimonialCard(slide) {
  const imageCol = slide.querySelector('.carousel-testimonial-slide-image');
  const content = slide.querySelector('.carousel-testimonial-slide-content');
  if (!content) return;

  const paragraphs = [...content.querySelectorAll(':scope > p')];
  // A paragraph whose only meaningful child is a picture/img is the company logo.
  const logoParagraph = paragraphs.find(
    (p) => p.querySelector('picture, img') && p.textContent.trim() === '',
  );
  // Remaining text paragraphs: [result, quote, name, role]. The last two text
  // paragraphs (if present) form the author name + role.
  const textParagraphs = paragraphs.filter((p) => p !== logoParagraph);
  const n = textParagraphs.length;
  const roleParagraph = n >= 1 ? textParagraphs[n - 1] : null;
  const nameParagraph = n >= 2 ? textParagraphs[n - 2] : null;

  if (!nameParagraph && !imageCol && !logoParagraph) return;

  const footer = document.createElement('div');
  footer.classList.add('carousel-testimonial-slide-footer');

  const author = document.createElement('div');
  author.classList.add('carousel-testimonial-slide-author');
  if (imageCol) {
    imageCol.classList.add('carousel-testimonial-slide-headshot');
    author.append(imageCol);
  }
  if (nameParagraph || roleParagraph) {
    const meta = document.createElement('div');
    meta.classList.add('carousel-testimonial-slide-author-meta');
    if (nameParagraph) {
      nameParagraph.classList.add('carousel-testimonial-slide-author-name');
      meta.append(nameParagraph);
    }
    if (roleParagraph) {
      roleParagraph.classList.add('carousel-testimonial-slide-author-role');
      meta.append(roleParagraph);
    }
    author.append(meta);
  }
  footer.append(author);

  if (logoParagraph) {
    logoParagraph.classList.add('carousel-testimonial-slide-logo');
    footer.append(logoParagraph);
  }

  content.append(footer);
}

/**
 * Case-study variant: a white card (logo, title, quote, author, CTA) beside a
 * case-study photo with a decorative circle behind it (matches the source
 * `.section6` case-study slider). Only classifies existing paragraphs/columns
 * -- it does not read new content beyond an optional third "photo" column.
 * @param {Element} slide the decorated slide (li)
 */
function decorateCaseStudySlide(slide) {
  const content = slide.querySelector('.carousel-testimonial-slide-content');
  if (!content) return;

  const paragraphs = [...content.querySelectorAll(':scope > p')];
  // The CTA is the paragraph containing a link.
  const ctaParagraph = paragraphs.find((p) => p.querySelector('a'));
  // The author line starts with a dash ("- Name, Role, Company").
  const authorParagraph = paragraphs.find(
    (p) => p !== ctaParagraph && /^\s*[-–—]/.test(p.textContent),
  );
  const rest = paragraphs.filter((p) => p !== ctaParagraph && p !== authorParagraph);
  // First remaining paragraph is the headline; any others are the quote body.
  const [titleParagraph, ...quoteParagraphs] = rest;

  if (titleParagraph) {
    titleParagraph.classList.add('carousel-testimonial-cs-title');
    // An <em> in the title marks the phrase to highlight (matches the source
    // site's "$2 billion company..." marker-highlight treatment).
    const highlight = titleParagraph.querySelector('em');
    if (highlight) highlight.classList.add('carousel-testimonial-cs-highlight');
  }
  quoteParagraphs.forEach((p) => p.classList.add('carousel-testimonial-cs-quote'));
  if (authorParagraph) authorParagraph.classList.add('carousel-testimonial-cs-author');
  if (ctaParagraph) ctaParagraph.classList.add('carousel-testimonial-cs-cta');

  // The media column stacks the company logo above the case-study photo. A
  // decorative circle is drawn behind the photo purely in CSS.
  const media = slide.querySelector('.carousel-testimonial-slide-media');
  if (media) {
    const mediaParagraphs = [...media.querySelectorAll(':scope > p')];
    const images = mediaParagraphs
      .filter((p) => p.querySelector('picture, img'));
    // The last image is the case-study photo. Any image before it is the
    // company logo, which not every case study has.
    const photo = images.pop();
    const logo = images.pop();
    if (photo) {
      media.classList.add('carousel-testimonial-cs-media');
      photo.classList.add('carousel-testimonial-cs-photo');
      if (logo) logo.classList.add('carousel-testimonial-cs-logo');

      const videoParagraph = mediaParagraphs.find((p) => {
        if (p === photo || p === logo) return false;
        const href = p.querySelector('a')?.href || p.textContent.trim();
        try {
          const { hostname } = new URL(href);
          return hostname === 'youtube.com'
            || hostname.endsWith('.youtube.com')
            || hostname === 'youtu.be';
        } catch {
          return false;
        }
      });
      if (videoParagraph) {
        const href = videoParagraph.querySelector('a')?.href
          || videoParagraph.textContent.trim();
        const link = document.createElement('a');
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', photo.querySelector('img')?.alt || 'Play video on YouTube');
        link.append(...photo.childNodes);
        photo.append(link);
        videoParagraph.remove();
      }
    } else {
      media.remove();
    }
  }

  // Group the card + media into a row that carries the max-width/centering.
  // This must NOT live on the slide (li) itself -- the slide is a flex item
  // of the slides track (flex: 0 0 100%), and capping its own max-width there
  // shrinks its allocated track space too, letting the next slide bleed into
  // view. Constraining an inner row keeps the track at the full 100% width.
  const row = document.createElement('div');
  row.classList.add('carousel-testimonial-cs-row');
  row.append(...slide.children);
  slide.append(row);
}

function createSlide(row, slideIndex, carouselId, isCaseStudy, isQuoteVariant) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-testimonial-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-testimonial-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    // Case-study rows lead with the copy and follow with a media column holding
    // the company logo and the case-study photo. The default testimonial rows
    // lead with the author headshot instead.
    let role;
    if (isCaseStudy) role = colIdx === 0 ? 'content' : 'media';
    else role = colIdx === 0 ? 'image' : 'content';
    column.classList.add(`carousel-testimonial-slide-${role}`);
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  if (isCaseStudy) {
    decorateCaseStudySlide(slide);
  } else if (isQuoteVariant) {
    // The `quote` variant is a single large centered testimonial (quote + author
    // line) with no headshot/logo footer, so skip the card-footer regrouping —
    // that logic would misread the quote/author paragraphs as name/role. Just tag
    // the two paragraphs for the variant's typography.
    const content = slide.querySelector('.carousel-testimonial-slide-content');
    if (content) {
      const paras = [...content.querySelectorAll(':scope > p')];
      if (paras[0]) paras[0].classList.add('carousel-testimonial-quote-text');
      if (paras[1]) paras[1].classList.add('carousel-testimonial-quote-author');
    }
  } else {
    decorateTestimonialCard(slide);
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-testimonial-${carouselId}`);
  const isCaseStudy = block.classList.contains('case-study');
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;
  const isQuoteVariant = block.classList.contains('quote');

  const placeholders = {};

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-testimonial-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-testimonial-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-testimonial-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-testimonial-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;

    container.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId, isCaseStudy, isQuoteVariant);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-testimonial-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
  }
}
