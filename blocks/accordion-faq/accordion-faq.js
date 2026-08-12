/*
 * Accordion Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

/*
 * Enterprise "Maintenance software even IT will love" variant: production pairs
 * each accordion row with a quote-image panel on the right. Opening a row is
 * single-open (closes the others) and swaps the panel's coloured background +
 * quote image. The quote images are authored in a sibling content block, so
 * relocate them into a synced panel beside the accordion and pair them to the
 * rows in order. Scoped to .enterprise-scale so other accordions are unaffected.
 */
function decorateEnterprisePanel(block, section) {
  const details = [...block.querySelectorAll('.accordion-faq-item')];
  if (details.length < 2) return;

  // The quote images live in the section's content wrapper that holds >= one
  // image per row; pick the wrapper with the most images.
  const wrappers = [...section.querySelectorAll('.default-content-wrapper')];
  let imgWrapper = null;
  let imgs = [];
  wrappers.forEach((w) => {
    const wi = [...w.querySelectorAll('img')];
    if (wi.length >= details.length && wi.length > imgs.length) { imgs = wi; imgWrapper = w; }
  });
  if (imgs.length < details.length) return;
  imgs = imgs.slice(0, details.length);

  const panel = document.createElement('div');
  panel.className = 'accordion-faq-panel';
  imgs.forEach((img, i) => {
    const fig = document.createElement('figure');
    fig.className = `accordion-faq-figure accordion-faq-figure-${i + 1}`;
    if (i === 0) fig.classList.add('active');
    fig.append(img.closest('picture') || img);
    panel.append(fig);
  });
  // clean up now-empty paragraphs left in the source wrapper
  imgWrapper.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('picture, img')) p.remove();
  });

  // wrap accordion + panel side by side
  const flex = document.createElement('div');
  flex.className = 'accordion-faq-flex';
  block.parentNode.insertBefore(flex, block);
  flex.append(block, panel);

  const figures = [...panel.children];
  const setActive = (idx) => {
    details.forEach((d, i) => { if (i !== idx) d.open = false; });
    figures.forEach((f, i) => f.classList.toggle('active', i === idx));
  };
  details.forEach((d, i) => {
    d.addEventListener('toggle', () => { if (d.open) setActive(i); });
  });
  if (!details.some((d) => d.open)) { details[0].open = true; setActive(0); }
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1];
    body.className = 'accordion-faq-item-body';
    // decorate accordion item
    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    details.append(summary, body);
    row.replaceWith(details);
  });

  const section = block.closest('.enterprise-scale');
  if (section) decorateEnterprisePanel(block, section);
}
