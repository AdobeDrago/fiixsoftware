/**
 * Decorates a row of case-study statistics.
 *
 * The block accepts both standard EDS two-column rows and the direct-child
 * markup used by the legacy case-study importer.
 *
 * @param {Element} block The stats-multi block
 */
export default function decorate(block) {
  [...block.children].forEach((item) => {
    item.classList.add('stats-multi-item');

    const children = [...item.children];
    const hasCells = children.length >= 2
      && children.every((child) => child.children.length > 0);

    if (hasCells) {
      const [valueCell, labelCell] = children;
      valueCell.classList.add('stats-multi-value-cell');
      labelCell.classList.add('stats-multi-label-cell');
      valueCell.querySelector(':scope > :first-child')?.classList.add('stats-multi-value');
      labelCell.querySelector(':scope > :first-child')?.classList.add('stats-multi-label');
      return;
    }

    children[0]?.classList.add('stats-multi-value');
    children[1]?.classList.add('stats-multi-label');
  });
}
