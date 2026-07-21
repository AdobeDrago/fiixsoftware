/**
 * promo-bar — full-width announcement band shown above the hero.
 * The message and link are authored content. The announcement link points to an
 * external campaign page, so it opens in a new tab (Document Authoring drops the
 * authored target attribute, so the block re-applies it here).
 */
export default function decorate(block) {
  // Flatten the single-cell block table into one message paragraph.
  const cell = block.querySelector(':scope > div > div') || block.firstElementChild;
  if (cell) {
    block.textContent = '';
    while (cell.firstChild) block.append(cell.firstChild);
  }
  block.querySelectorAll('a').forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });
}
