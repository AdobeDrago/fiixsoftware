import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * cards-timeline — a horizontal, connected milestone timeline.
 *
 * Authored as a cards-style table: each row is one milestone. The row's cells
 * hold, in order, the milestone label (product name) and the date/year. An
 * optional image cell (icon) is supported. The block lays the milestones along
 * a horizontal rail with a connecting line and a dot marker per milestone, then
 * falls back to a stacked list on small screens (handled in CSS).
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-timeline-item';
    while (row.firstElementChild) li.append(row.firstElementChild);

    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-timeline-item-image';
      } else {
        div.className = 'cards-timeline-item-body';
      }
    });

    // Within the body, the last short line (a bare year/date) is the date; the
    // remaining content is the label. Tag them so CSS can place the label above
    // the rail and the date below it.
    const body = li.querySelector('.cards-timeline-item-body');
    if (body) {
      const paras = [...body.querySelectorAll(':scope > p')];
      // A "date" paragraph is a short line that is mostly digits (e.g. a year
      // like "2026" or "Q3 2024") and contains no links/strong emphasis label.
      const isDate = (p) => {
        const t = p.textContent.trim();
        return t.length <= 12 && /\d/.test(t) && !p.querySelector('a');
      };
      const dateP = [...paras].reverse().find(isDate);
      if (dateP) dateP.classList.add('cards-timeline-date');
      paras
        .filter((p) => p !== dateP)
        .forEach((p) => p.classList.add('cards-timeline-label'));
    }

    // The dot marker on the rail. Purely decorative; the rail line itself is
    // drawn with CSS on the <ul>.
    const marker = document.createElement('span');
    marker.className = 'cards-timeline-marker';
    marker.setAttribute('aria-hidden', 'true');
    li.append(marker);

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '200' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.classList.add(`cards-timeline-${ul.children.length}-cols`);
  block.replaceChildren(ul);
}
