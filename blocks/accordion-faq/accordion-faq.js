/*
 * Accordion Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

/*
 * enterprise-scale and pf-explore sections pair the accordion with a synced
 * image panel that swaps per open row. Preferred authoring: a 3rd column per
 * row (heading | body | image). Falls back to matching a separate sibling
 * image block by document order, for pages not yet migrated.
 */
const FEATURE_PANEL_VARIANTS = {
  'enterprise-scale': 'after', // panel right
  'pf-explore': 'before', // panel left
};

function wrapBodyContent(body) {
  let paragraph = body.querySelector(':scope > p');
  if (!paragraph) {
    paragraph = document.createElement('p');
    paragraph.append(...body.childNodes);
    body.append(paragraph);
  }
  const link = paragraph.querySelector(':scope > a, :scope > span > a');
  if (link && !link.classList.contains('arrow-cta')) {
    link.classList.add('arrow-cta');
    if (!link.parentElement.matches('span')) {
      const span = document.createElement('span');
      span.append(link);
      paragraph.append(span);
    }
  }
}

function syncItemState(details, index) {
  details.dataset.featureMenu = String(index + 1);
  details.classList.toggle('open', details.open);
  details.classList.toggle('closed', !details.open);
}

function decorateFeaturePanel(block, section, panelPosition) {
  const details = [...block.querySelectorAll('.accordion-faq-item')];
  if (details.length < 2) return;

  let imgs = details.map((d) => d.querySelector(':scope > .accordion-faq-item-image img'));
  if (imgs.every(Boolean)) {
    details.forEach((d) => d.querySelector(':scope > .accordion-faq-item-image').remove());
  } else {
    // fallback: images authored as a separate sibling block, matched by order
    const wrappers = [...section.querySelectorAll('.default-content-wrapper')];
    let imgWrapper = null;
    imgs = [];
    wrappers.forEach((w) => {
      const wi = [...w.querySelectorAll('img')];
      if (wi.length >= details.length && wi.length > imgs.length) { imgs = wi; imgWrapper = w; }
    });
    if (imgs.length < details.length) return;
    imgs = imgs.slice(0, details.length);
    imgWrapper.querySelectorAll('p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('picture, img')) p.remove();
    });
  }

  const panel = document.createElement('div');
  panel.className = 'accordion-faq-panel';
  imgs.forEach((img, i) => {
    const fig = document.createElement('figure');
    fig.className = `accordion-faq-figure accordion-faq-figure-${i + 1}`;
    if (i === 0) fig.classList.add('active');
    fig.append(img.closest('picture') || img);
    panel.append(fig);
  });

  const flex = document.createElement('div');
  flex.className = 'accordion-faq-flex';
  block.parentNode.insertBefore(flex, block);
  if (panelPosition === 'before') flex.append(panel, block);
  else flex.append(block, panel);

  const figures = [...panel.children];
  const setActive = (idx) => {
    details.forEach((d, i) => {
      d.open = i === idx;
      syncItemState(d, i);
    });
    figures.forEach((f, i) => f.classList.toggle('active', i === idx));
  };
  details.forEach((d, i) => {
    wrapBodyContent(d.querySelector('.accordion-faq-item-body'));
    syncItemState(d, i);
    // Match live section6: open item cannot close on its own click;
    // only switching to another heading closes the previous one.
    d.querySelector('summary').addEventListener('click', (e) => {
      if (d.open) e.preventDefault();
    });
    d.addEventListener('toggle', () => {
      if (d.open) setActive(i);
      else syncItemState(d, i);
    });
  });
  if (!details.some((d) => d.open)) { details[0].open = true; setActive(0); }
}

function enableExclusiveAccordion(block) {
  const items = [...block.querySelectorAll('.accordion-faq-item')];
  items.forEach((item) => {
    // Open item cannot close on its own click; only switching to another closes it.
    item.querySelector('summary').addEventListener('click', (e) => {
      if (item.open) e.preventDefault();
    });
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      items.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
  if (items[0]) items[0].open = true;
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // row.children is live — read all columns before a move shifts indices
    const [label, body, image] = row.children;
    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    summary.append(...label.childNodes);
    body.className = 'accordion-faq-item-body';
    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    details.append(summary, body);
    if (image) {
      image.className = 'accordion-faq-item-image';
      details.append(image);
    }
    row.replaceWith(details);
  });

  const variant = Object.keys(FEATURE_PANEL_VARIANTS).find((v) => block.closest(`.${v}`));
  if (variant) {
    decorateFeaturePanel(block, block.closest(`.${variant}`), FEATURE_PANEL_VARIANTS[variant]);
  } else {
    enableExclusiveAccordion(block);
  }
}
