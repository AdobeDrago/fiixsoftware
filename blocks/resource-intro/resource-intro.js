/**
 * Loads and decorates the resource center introduction.
 *
 * The block intentionally keeps the authored heading and description in the
 * DOM so authors can reuse it for other resource-center landing pages.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const headingContent = rows[0]?.querySelector('p, h1, h2, h3, h4, h5, h6');
  const descriptionContent = rows[1]?.querySelector('p, h1, h2, h3, h4, h5, h6');

  // Imported DA.live rows contain plain text, which EDS wraps in paragraphs.
  // Promote those rows to the semantic heading structure used by the live page.
  if (headingContent && headingContent.tagName === 'P') {
    const heading = document.createElement('h1');
    heading.innerHTML = headingContent.innerHTML;
    headingContent.replaceWith(heading);
  }

  if (descriptionContent && descriptionContent.tagName === 'P') {
    const description = document.createElement('h2');
    description.innerHTML = descriptionContent.innerHTML;
    descriptionContent.replaceWith(description);
  }

  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  const description = rows[1]?.querySelector('h1, h2, h3, h4, h5, h6, p');

  if (heading) heading.classList.add('resource-intro-heading');
  if (description) description.classList.add('resource-intro-description');
}
