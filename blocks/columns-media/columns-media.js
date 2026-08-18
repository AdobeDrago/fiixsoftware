export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-media-${cols.length}-cols`);

  // Free-CMMS media panels: each section carries an accent style
  // (accent-yellow / accent-teal / accent-blue) applied as a section class by
  // decorateSectionMetadata (scripts.js). Mirror that onto the block so the
  // panel treatment (colored full-bleed panel behind the screenshot + accent
  // heading underline) can be scoped to the block. Scoped to columns-media;
  // other templates that use this block have no accent style and are untouched.
  const accentSection = block.closest('.section');
  if (accentSection) {
    const accent = ['accent-yellow', 'accent-teal', 'accent-blue']
      .find((a) => accentSection.classList.contains(a));
    if (accent) {
      block.classList.add('columns-media-accent', `columns-media-${accent}`);
    }
  }

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pics = [...col.querySelectorAll('picture')];
      // A media column that is ONLY image(s) is the image column. When it holds
      // two images, the first is the authorable decorative shape overlay and the
      // second is the product screenshot (see the parser). Authors can add/remove
      // the shape simply by adding/removing that first image in the cell.
      if (pics.length && col.textContent.trim() === '') {
        col.classList.add('columns-media-img-col');
        if (pics.length >= 2) {
          const shapePic = pics[0];
          shapePic.classList.add('columns-media-shape-img');
          // Lift the shape into its own wrapper (not the <p> it shares with the
          // screenshot) so only the shape is positioned as an overlay, leaving
          // the screenshot in normal flow.
          const shapeWrap = document.createElement('div');
          shapeWrap.className = 'columns-media-shape';
          col.prepend(shapeWrap);
          shapeWrap.append(shapePic);
          block.classList.add('columns-media-has-shape');
        }
      }
    });
  });

  // Shape orientation variant (authorable): `shape-vertical` overhangs the top,
  // `shape-horizontal` sits beside the screenshot. Normalise the token the
  // library variant syntax produces (space → hyphen already handled by EDS) and
  // default to vertical when a shape is present but no orientation is specified.
  if (block.classList.contains('columns-media-has-shape')
    && !block.classList.contains('shape-horizontal')
    && !block.classList.contains('shape-vertical')) {
    block.classList.add('shape-vertical');
  }

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
