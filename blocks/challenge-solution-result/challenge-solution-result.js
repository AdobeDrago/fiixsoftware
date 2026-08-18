const ITEM_TYPES = ['challenge', 'solution', 'result'];

const ICONS = {
  challenge: `
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.5L13.7 3.9a2 2 0 0 0-3.4 0Z"/>
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    </svg>`,
  solution: `
    <svg viewBox="0 0 24 24" focusable="false">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>
    </svg>`,
  result: `
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M3 3v18h18"/>
      <path d="m7 15 4-4 3 3 6-7"/>
      <path d="M15 7h5v5"/>
    </svg>`,
};

function createIcon(type) {
  const icon = document.createElement('span');
  icon.className = 'challenge-solution-result-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = ICONS[type];
  return icon;
}

function decorateNewTabLink(link) {
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  link.classList.add('challenge-solution-result-external-link');

  if (!link.querySelector('.challenge-solution-result-new-tab')) {
    const announcement = document.createElement('span');
    announcement.className = 'challenge-solution-result-new-tab';
    announcement.textContent = ' (opens in new tab)';
    link.append(announcement);
  }
}

/**
 * Decorates the challenge, solution, and result case-study timeline.
 * @param {Element} block The challenge-solution-result block element
 */
export default function decorate(block) {
  const authoredCells = [...block.querySelectorAll(':scope > div > div')];
  const items = authoredCells.length ? authoredCells : [...block.children];

  items.forEach((item, index) => {
    const type = ITEM_TYPES[index];
    item.classList.add('challenge-solution-result-item');

    if (!type) return;

    item.classList.add(`challenge-solution-result-${type}`);
    const heading = item.querySelector('h2, h3, h4');
    if (heading && !heading.querySelector('.challenge-solution-result-icon')) {
      heading.prepend(createIcon(type));
    }

    if (type === 'solution') {
      item.querySelectorAll('a[href]').forEach(decorateNewTabLink);
    }
  });
}
