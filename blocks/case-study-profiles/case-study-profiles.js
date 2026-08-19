/**
 * Decorates repeatable case-study spokesperson rows.
 *
 * @param {Element} block The case-study profiles block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [imageColumn, detailsColumn] = row.children;
    const hasImage = imageColumn?.querySelector('picture, img');

    if (!hasImage || !detailsColumn?.textContent.trim()) {
      row.classList.add('case-study-profile-invalid');
      return;
    }

    row.classList.add('case-study-profile');
    imageColumn.classList.add('case-study-profile-image');
    detailsColumn.classList.add('case-study-profile-details');
  });
}
