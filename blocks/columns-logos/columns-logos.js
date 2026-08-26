export default function decorate(block) {
  // "columns-logos (with-heading)" adds a heading row before the paragraph;
  // plain "columns-logos" has only the paragraph row.
  const withHeading = block.classList.contains('with-heading');
  let logoRowCols = 0;
  let textRowIndex = 0;

  [...block.children].forEach((row) => {
    const cols = [...row.children];
    const hasImage = cols.some((col) => col.querySelector('picture'));

    if (hasImage) {
      // logo row: any row that carries at least one picture
      row.classList.add('columns-logos-row');
      logoRowCols = logoRowCols || cols.length;
      cols.forEach((col) => {
        const pic = col.querySelector('picture');
        if (pic && col.children.length === 1) {
          // picture is only content in column
          col.classList.add('columns-logos-img-col');
        }
      });
      return;
    }

    const role = withHeading && textRowIndex === 0
      ? 'columns-logos-heading-row'
      : 'columns-logos-text-row';
    textRowIndex += 1;

    if (row.textContent.trim()) {
      row.classList.add(role);
    } else {
      // author left this row empty: drop it so it doesn't leave a gap
      row.remove();
    }
  });

  if (logoRowCols) {
    block.classList.add(`columns-logos-${logoRowCols}-cols`);
  }
}
