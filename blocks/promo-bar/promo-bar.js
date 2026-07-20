/**
 * promo-bar — full-width announcement band shown above the hero.
 * The message (and any link) is authored content; nothing is hardcoded here.
 * Links marked to open in a new tab keep their target/rel.
 */
export default function decorate(block) {
  // Flatten the single-cell block table into one message paragraph.
  const cell = block.querySelector(':scope > div > div') || block.firstElementChild;
  if (cell) {
    block.textContent = '';
    while (cell.firstChild) block.append(cell.firstChild);
  }
  block.querySelectorAll('a[target="_blank"]').forEach((a) => {
    a.setAttribute('rel', 'noopener noreferrer');
  });
}
