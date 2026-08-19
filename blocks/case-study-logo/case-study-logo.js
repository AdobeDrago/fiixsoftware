/**
 * Marks missing required logo content so the overlap is not applied to an
 * otherwise empty block.
 *
 * @param {Element} block The case-study logo block
 */
export default function decorate(block) {
  const image = block.querySelector('picture, img');
  if (!image) block.classList.add('case-study-logo-missing-image');
}
