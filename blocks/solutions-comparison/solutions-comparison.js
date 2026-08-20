const FALLBACK_ICONS = [
  '<svg viewBox="0 0 24 24" focusable="false"><path d="m4 20 2.1-6.4L16.8 2.9a2.1 2.1 0 0 1 3 3L9.1 16.6z"/><path d="m14.8 4.9 4.3 4.3"/></svg>',
  '<svg viewBox="0 0 24 24" focusable="false"><path d="M6 18h12l-1.3-8H7.3z"/><path d="M8 10V6h8v4"/><path d="M10 18v-2h4v2"/></svg>',
  '<svg viewBox="0 0 24 24" focusable="false"><path d="m4 12 5 5L20 6"/></svg>',
];

function promoteSolutionTitle(cell) {
  const textElements = [...cell.children].filter((element) => element.textContent.trim());
  const [label, title] = textElements;

  label?.classList.add('solutions-comparison-label');

  if (!title) return;

  if (/^H[1-6]$/.test(title.tagName)) {
    title.classList.add('solutions-comparison-title');
    return;
  }

  const heading = document.createElement('h3');
  heading.className = 'solutions-comparison-title';
  while (title.firstChild) heading.append(title.firstChild);
  title.replaceWith(heading);
}

function addFallbackIcon(iconCell, index) {
  if (iconCell.querySelector('picture, img, svg')) return;

  const icon = document.createElement('span');
  icon.className = 'solutions-comparison-fallback-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = FALLBACK_ICONS[index % FALLBACK_ICONS.length];
  iconCell.append(icon);
}

/**
 * Decorates a three-step solution comparison.
 *
 * Each authored row has three cells: solution label and name, icon, and result.
 * The icon cell accepts an author-provided image; an accessible decorative SVG is
 * supplied when no image is authored.
 *
 * @param {Element} block The solutions-comparison block element
 */
export default function decorate(block) {
  const timeline = document.createElement('ol');
  timeline.className = 'solutions-comparison-list';

  [...block.children].forEach((row, index) => {
    const [solutionCell, iconCell, resultCell] = [...row.children];
    if (!solutionCell || !resultCell) return;

    const item = document.createElement('li');
    item.className = 'solutions-comparison-item';

    solutionCell.classList.add('solutions-comparison-solution');
    promoteSolutionTitle(solutionCell);
    item.append(solutionCell);

    const icon = iconCell || document.createElement('div');
    icon.classList.add('solutions-comparison-icon');
    addFallbackIcon(icon, index);
    item.append(icon);

    resultCell.classList.add('solutions-comparison-result');
    item.append(resultCell);

    timeline.append(item);
  });

  block.replaceChildren(timeline);
}
