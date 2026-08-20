// authors sometimes style the paragraph line with a Heading style in the
// doc; demote it to a real <p> so the DOM keeps a correct heading hierarchy
// instead of just faking the look with CSS.
function demoteHeadingsToParagraphs(row) {
  row.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
    const p = document.createElement('p');
    p.append(...heading.childNodes);
    heading.replaceWith(p);
  });
}

export default function decorate(block) {
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

    // non-image rows are the fixed heading/paragraph slots, in document
    // order: the first is always the heading, the second the paragraph --
    // by position, not by whatever tag the author's rich-text style
    // produced (a subtext line styled as "Heading 2" in the doc must still
    // render as the smaller paragraph, not the big headline).
    const role = textRowIndex === 0 ? 'columns-logos-heading-row' : 'columns-logos-text-row';
    textRowIndex += 1;

    if (row.textContent.trim()) {
      if (role === 'columns-logos-text-row') {
        demoteHeadingsToParagraphs(row);
      }
      row.classList.add(role);
    } else {
      // author left this slot empty: drop it so it doesn't leave a gap
      row.remove();
    }
  });

  if (logoRowCols) {
    block.classList.add(`columns-logos-${logoRowCols}-cols`);
  }
}
