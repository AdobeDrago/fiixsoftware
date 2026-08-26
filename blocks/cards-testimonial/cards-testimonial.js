/**
 * cards-testimonial -- static 3-up grid of short review cards.
 *
 * Unlike carousel-testimonial (which scrolls case studies with prev/next
 * controls), this block renders every review at once as centered cards. Each
 * source row is one card:
 *   • an optional rating paragraph ("5 out of 5 stars") -> a row of star glyphs
 *   • a quote paragraph
 *   • author name + role paragraphs
 * No scroll, snap, or navigation logic.
 */

/**
 * Turn a "N out of 5 stars" paragraph into an accessible star row.
 * @param {Element} p the rating paragraph
 * @returns {Element} the decorated star element (reusing the paragraph)
 */
function decorateRating(p) {
  const match = p.textContent.match(/(\d+(?:\.\d+)?)\s*out of\s*(\d+)/i);
  const filled = match ? Math.round(parseFloat(match[1])) : 5;
  const total = match ? parseInt(match[2], 10) : 5;
  const label = p.textContent.trim();

  p.classList.add('cards-testimonial-rating');
  p.textContent = '';
  p.setAttribute('role', 'img');
  p.setAttribute('aria-label', label);

  for (let i = 0; i < total; i += 1) {
    const star = document.createElement('span');
    star.classList.add('cards-testimonial-star');
    if (i >= filled) star.classList.add('cards-testimonial-star-empty');
    star.textContent = '★';
    star.setAttribute('aria-hidden', 'true');
    p.append(star);
  }
  return p;
}

/**
 * Decorate a single source row into a review card.
 * @param {Element} card the row (already a card container)
 */
function decorateCard(card) {
  card.classList.add('cards-testimonial-card');

  const paragraphs = [...card.querySelectorAll(':scope > p')];
  if (paragraphs.length === 0) return;

  // A leading "N out of 5 stars" paragraph becomes the star rating.
  const ratingParagraph = paragraphs.find((p) => /out of\s*\d+\s*stars?/i.test(p.textContent));
  if (ratingParagraph) decorateRating(ratingParagraph);

  const textParagraphs = paragraphs.filter((p) => p !== ratingParagraph);
  // Last two text paragraphs (if present) are the author name + role.
  const n = textParagraphs.length;
  const roleParagraph = n >= 1 ? textParagraphs[n - 1] : null;
  const nameParagraph = n >= 2 ? textParagraphs[n - 2] : null;
  // Everything before the author lines is the quote body.
  const quoteParagraphs = textParagraphs.slice(0, Math.max(0, n - 2));

  quoteParagraphs.forEach((p) => p.classList.add('cards-testimonial-quote'));
  if (nameParagraph) nameParagraph.classList.add('cards-testimonial-name');
  if (roleParagraph) roleParagraph.classList.add('cards-testimonial-role');

  if (nameParagraph || roleParagraph) {
    const author = document.createElement('div');
    author.classList.add('cards-testimonial-author');
    if (nameParagraph) author.append(nameParagraph);
    if (roleParagraph) author.append(roleParagraph);
    card.append(author);
  }
}

/** Number of cards visible before any reveal, and how many each click adds.
 *  Matched to the source (fiixsoftware.com/customers: 6 initial, +12 per click). */
const INITIAL_VISIBLE = 6;
const REVEAL_STEP = 12;

/**
 * Clamp the grid to INITIAL_VISIBLE cards and wire a "Read more" button that
 * reveals REVEAL_STEP more per click, hiding itself once all are shown. The
 * button is the author's trailing "Read more" element (adopted into the block
 * so it controls the grid), or a generated one as a fallback.
 * @param {Element} block the block element
 * @param {HTMLUListElement} list the card list
 */
function setupReadMore(block, list) {
  const cards = [...list.children];
  if (cards.length <= INITIAL_VISIBLE) return;

  // Adopt a trailing "Read more" element authored after the block (a <p>/button
  // in the same section wrapper), else build one so the block is self-contained.
  const wrapper = block.closest('.cards-testimonial-wrapper') || block.parentElement;
  let authored = null;
  let sib = wrapper && wrapper.nextElementSibling;
  while (sib && !authored) {
    if (/^read more$/i.test(sib.textContent.trim())) authored = sib;
    sib = sib.nextElementSibling;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cards-testimonial-more';
  button.textContent = authored ? authored.textContent.trim() : 'Read more';
  if (authored) authored.remove();

  let shown = INITIAL_VISIBLE;
  const apply = () => {
    cards.forEach((card, i) => {
      card.classList.toggle('cards-testimonial-hidden', i >= shown);
    });
    if (shown >= cards.length) button.hidden = true;
  };
  apply();

  button.addEventListener('click', () => {
    shown += REVEAL_STEP;
    apply();
  });

  block.append(button);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.classList.add('cards-testimonial-list');

  [...block.children].forEach((row) => {
    const card = document.createElement('li');
    // Merge the row's column(s) into a single card body.
    [...row.children].forEach((col) => {
      while (col.firstElementChild) card.append(col.firstElementChild);
    });
    decorateCard(card);
    list.append(card);
    row.remove();
  });

  block.append(list);

  // Progressive reveal ("Read more") for long review grids — only the `plain`
  // variant clamps; the base 3-up trio always shows all cards.
  if (block.classList.contains('plain')) setupReadMore(block, list);
}
