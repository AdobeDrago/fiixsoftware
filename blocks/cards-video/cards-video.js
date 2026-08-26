import { createOptimizedPicture } from '../../scripts/aem.js';

// Infinite carousel: clone cards onto both ends, snap back to the real card once a clone settles.
function buildCarousel(block, ul) {
  const realCards = [...ul.children];
  const count = realCards.length;
  if (count <= 3) return;

  const CLONE_COUNT = Math.min(count - 1, 5);
  const cloneOf = (li) => {
    const clone = li.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('inert', '');
    return clone;
  };
  ul.prepend(...realCards.slice(-CLONE_COUNT).map(cloneOf));
  ul.append(...realCards.slice(0, CLONE_COUNT).map(cloneOf));

  const cards = [...ul.children];
  ul.classList.add('cards-video-track');
  cards.forEach((li) => li.classList.add('cards-video-slide'));

  const targetLeftFor = (i) => cards[i].offsetLeft - ul.offsetLeft;

  let unit = 0; // width+gap of one card, set once layout is measurable
  let lap = 0; // scroll distance of one full lap of real cards
  let index = CLONE_COUNT; // logical slide index

  // rAF-driven easing instead of scrollTo({behavior:'smooth'}), which drops distance on retarget
  let animTarget = null;
  let animFrame = null;

  // shifts by one lap when near the clone buffer edge, landing on an identical clone
  const recenter = () => {
    if (!unit) return; // layout not ready yet
    const maxScroll = ul.scrollWidth - ul.clientWidth;
    const margin = unit;
    while (ul.scrollLeft < margin || (animTarget !== null && animTarget < margin)) {
      ul.scrollLeft += lap;
      if (animTarget !== null) animTarget += lap;
      index += count;
    }
    const ceiling = maxScroll - margin;
    while (ul.scrollLeft > ceiling || (animTarget !== null && animTarget > ceiling)) {
      ul.scrollLeft -= lap;
      if (animTarget !== null) animTarget -= lap;
      index -= count;
    }
  };

  const animateToIndex = (i) => {
    animTarget = targetLeftFor(i);
    recenter();
    if (animFrame !== null) return;
    ul.style.scrollSnapType = 'none';
    const step = () => {
      const diff = animTarget - ul.scrollLeft;
      // snap the last few pixels directly; integer scrollLeft rounds smaller diffs to zero
      if (Math.abs(diff) < 4) {
        ul.scrollLeft = animTarget;
        animFrame = null;
        return;
      }
      ul.scrollLeft += diff * 0.25;
      recenter();
      animFrame = requestAnimationFrame(step);
    };
    animFrame = requestAnimationFrame(step);
  };
  const jumpToIndex = (i) => {
    animTarget = null;
    if (animFrame !== null) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
    ul.scrollLeft = targetLeftFor(i);
  };

  const goTo = (i) => {
    index = i;
    animateToIndex(index);
  };

  // section is display:none until loadSection finishes, so offsetLeft reads 0 until then
  const jumpToStartWhenVisible = () => {
    if (ul.clientWidth) {
      unit = targetLeftFor(1) - targetLeftFor(0);
      lap = count * unit;
      jumpToIndex(index);
    } else {
      requestAnimationFrame(jumpToStartWhenVisible);
    }
  };
  jumpToStartWhenVisible();

  const nav = document.createElement('div');
  nav.className = 'cards-video-nav';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'cards-video-prev';
  prev.setAttribute('aria-label', 'Previous videos');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'cards-video-next';
  next.setAttribute('aria-label', 'Next videos');

  const dots = document.createElement('div');
  dots.className = 'cards-video-dots';
  const dotEls = realCards.map((li, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'cards-video-dot';
    dot.setAttribute('aria-label', `Go to video ${i + 1}`);
    dot.addEventListener('click', () => goTo(CLONE_COUNT + i));
    dots.append(dot);
    return dot;
  });
  dotEls[0].classList.add('active');

  nav.append(prev, dots, next);
  ul.after(nav);

  prev.addEventListener('click', () => goTo(index - 1));
  next.addEventListener('click', () => goTo(index + 1));

  // index of the card closest to the track's left edge
  const leftmostIndex = () => {
    const target = ul.scrollLeft + ul.offsetLeft;
    let closest = 0;
    let min = Infinity;
    cards.forEach((li, i) => {
      const dist = Math.abs(li.offsetLeft - target);
      if (dist < min) { min = dist; closest = i; }
    });
    return closest;
  };

  let settleTimer;
  ul.addEventListener('scroll', () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      // skip if a newer click already started animating; that one gets its own settle
      if (animFrame !== null) return;
      let realIndex = leftmostIndex() - CLONE_COUNT;
      if (realIndex < 0) {
        realIndex += count;
        index = CLONE_COUNT + realIndex;
        jumpToIndex(index);
      } else if (realIndex >= count) {
        realIndex -= count;
        index = CLONE_COUNT + realIndex;
        jumpToIndex(index);
      } else {
        index = CLONE_COUNT + realIndex;
      }
      ul.style.scrollSnapType = '';
      dotEls.forEach((d, di) => d.classList.toggle('active', di === realIndex));
    }, 120);
  });
}

let vidyardScriptLoading = null;
function loadVidyardScript() {
  vidyardScriptLoading ||= new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://play.vidyard.com/embed/v4.js';
    script.async = true;
    script.onload = resolve;
    document.head.append(script);
  });
  return vidyardScriptLoading;
}

// video link is authored as a Vidyard URL (e.g. https://play.vidyard.com/<uuid>)
function vidyardUuidFrom(href) {
  const match = href.match(/vidyard\.com\/(?:watch\/)?([\w-]+)/);
  return match && match[1];
}

function wireVidyardVideo(li, uuid) {
  // wrapper div keeps the embed hidden via CSS; Vidyard's SDK overrides a `hidden` attr directly
  const hideWrap = document.createElement('div');
  hideWrap.className = 'cards-video-embed-hide';
  const embed = document.createElement('div');
  embed.className = 'vidyard-player-embed';
  embed.dataset.uuid = uuid;
  embed.dataset.v = '4';
  embed.dataset.type = 'lightbox';
  hideWrap.append(embed);
  li.append(hideWrap);
  li.addEventListener('click', async () => {
    await loadVidyardScript();
    const player = window.VidyardV4?.api?.getPlayersByUUID?.(uuid)?.[0];
    if (player) player.showLightbox();
  });
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-video-card-image';
      else div.className = 'cards-video-card-body';
    });
    const videoLink = li.querySelector('.cards-video-card-body a[href*="vidyard.com"]');
    if (videoLink) {
      const uuid = vidyardUuidFrom(videoLink.href);
      if (uuid) {
        wireVidyardVideo(li, uuid);
        videoLink.removeAttribute('href');
        videoLink.setAttribute('role', 'button');
      }
    } else if (!li.querySelector('.cards-video-card-image')
      && li.querySelector('.cards-video-card-body a[href]')) {
      // "Watch more demos" tile — link only, no thumbnail
      li.classList.add('cards-video-more');
      li.querySelectorAll('.cards-video-card-body').forEach((body) => {
        if (!body.querySelector('a[href]')) body.remove();
      });
    }
    // Inner shell so mobile can use full-width slides with a centered 310px card
    const card = document.createElement('div');
    card.className = 'cards-video-card';
    while (li.firstChild) card.append(li.firstChild);
    li.append(card);
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);

  buildCarousel(block, ul);
}
