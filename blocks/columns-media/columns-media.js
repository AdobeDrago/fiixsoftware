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
    // The image may be authored inside the block OR as a separate content block
    // in the same section, so search the whole section for it.
    const section = block.closest('.connect-users');
    const img = section.querySelector('img');
    if (img) {
      // Request a large render of the image so the background fills the band
      // like production (which uses a 1522px-wide asset). The default optimized
      // src is only 750px wide, which rendered the 3D scene at half size.
      const raw = img.getAttribute('src') || img.src;
      const large = raw.replace(/width=\d+/, 'width=1600');
      block.style.setProperty('--connect-media', `url("${large}")`);
      block.classList.add('columns-media-parallax');
      // The text column becomes the white card; empty (image) columns are dropped.
      const row = block.firstElementChild;
      [...row.children].forEach((col) => {
        if (col.textContent.trim() === '' && !col.querySelector('img')) col.remove();
        else col.classList.add('columns-media-card');
      });
      // Remove the standalone image wrapper now that it drives the background.
      const wrap = img.closest('.default-content-wrapper') || img.closest('picture');
      if (wrap && !block.contains(wrap)) wrap.remove();
    }
  }
}
