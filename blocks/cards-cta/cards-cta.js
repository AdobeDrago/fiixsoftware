/**
 * cards-cta — side-by-side call-to-action panels.
 * Each row of the authored table is one panel: an optional decorative image,
 * a heading, supporting text, and a CTA link. All content comes from the
 * authored DOM; nothing is hardcoded here.
 *
 * Variations (CSS-primary; decoration is shared):
 *   default — icon/figure + left-aligned copy + text CTA with arrow
 *   article — text-only centered panels + orange gradient pill
 *             (production `.CTAbox-flex > article` on /cmms/ai/)
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('cards-cta-panel');
    const cells = [...row.children];

    // A cell whose only meaningful child is an image is the decorative figure.
    cells.forEach((cell) => {
      const img = cell.querySelector('picture, img');
      const hasText = cell.textContent.trim().length > 0;
      if (img && !hasText) {
        cell.classList.add('cards-cta-figure');
      } else {
        cell.classList.add('cards-cta-body');
        // Style the last link in the body as the CTA button.
        const links = cell.querySelectorAll('a');
        const cta = links[links.length - 1];
        if (cta) cta.classList.add('cards-cta-button');
      }
    });
  });
}
