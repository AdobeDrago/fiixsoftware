import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * Production renders the demo videos as a CAROUSEL: a horizontal track showing
 * three cards at a time, with a pagination bar (prev arrow + dots + next arrow)
 * below. Build that here — the track is a scroll-snap flex row, prev/next scroll
 * by one card, and the dots reflect / drive the active card. Falls back to the
 * static row when there are three or fewer cards.
 */
function buildCarousel(block, ul) {
  const cards = [...ul.children];
  if (cards.length <= 3) return;

  ul.classList.add('cards-video-track');
  cards.forEach((li) => li.classList.add('cards-video-slide'));

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
  cards.forEach((li, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'cards-video-dot';
    dot.setAttribute('aria-label', `Go to video ${i + 1}`);
    dot.addEventListener('click', () => {
      ul.scrollTo({ left: li.offsetLeft - ul.offsetLeft, behavior: 'smooth' });
    });
    dots.append(dot);
  });

  nav.append(prev, dots, next);
  ul.after(nav);

  const step = () => {
    const gap = parseFloat(getComputedStyle(ul).columnGap) || 0;
    return cards[0].getBoundingClientRect().width + gap;
  };
  prev.addEventListener('click', () => ul.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => ul.scrollBy({ left: step(), behavior: 'smooth' }));

  // reflect the left-most visible card in the active dot
  const dotEls = [...dots.children];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const idx = cards.indexOf(entry.target);
      dotEls.forEach((d, di) => d.classList.toggle('active', di === idx));
    });
  }, { root: ul, threshold: 0.6 });
  cards.forEach((li) => io.observe(li));
  dotEls[0].classList.add('active');
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-video-card-image';
      else div.className = 'cards-video-card-body';
    });
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
