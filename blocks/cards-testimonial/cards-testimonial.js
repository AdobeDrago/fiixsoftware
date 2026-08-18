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
}
