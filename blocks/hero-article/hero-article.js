/**
 * loads and decorates the block
 *
 * The lead image is authored as default content ahead of the block. Pull it in
 * so the block can render the source's layered header: a full-bleed grey band
 * carrying the image, with the article meta on a white card over it.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const card = block.firstElementChild;
  if (!card) return;
  card.className = 'hero-article-card';
  if (card.firstElementChild) card.firstElementChild.className = 'hero-article-meta';

  const section = block.closest('.section');
  const lead = section && section.querySelector('.default-content-wrapper picture');
  if (!lead) {
    block.classList.add('no-image');
    return;
  }

  const frame = document.createElement('div');
  frame.className = 'hero-article-image';
  frame.append(lead);
  block.prepend(frame);

  // the wrapper that held the lead image is now empty
  section.querySelectorAll('.default-content-wrapper').forEach((wrapper) => {
    if (!wrapper.textContent.trim() && !wrapper.querySelector('picture')) wrapper.remove();
  });
}
