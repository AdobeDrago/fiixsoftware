export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-media-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-media-img-col');
        }
      }
    });
  });

  // Connect-users hero: production renders this as a full-width grey band whose
  // image is a fixed (parallax) background, with the text in a white card that
  // overlaps it. Move the authored image to a CSS background variable (so the
  // authored asset — once corrected in DA — drives the background) and tag the
  // band + text card. Scoped to .connect-users; other columns-media are untouched.
  if (block.closest('.connect-users')) {
    const img = block.querySelector('img');
    const imgCol = block.querySelector('.columns-media-img-col');
    if (img) {
      block.style.setProperty('--connect-media', `url("${img.getAttribute('src')}")`);
      block.classList.add('columns-media-parallax');
      if (imgCol) imgCol.remove();
      const textCol = block.querySelector(':scope > div > div');
      if (textCol) textCol.classList.add('columns-media-card');
    }
  }
}
