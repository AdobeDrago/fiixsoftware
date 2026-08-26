// Delayed site chrome (loaded after LCP).

const CHEVRON_UP = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14l6-6 6 6"/></svg>';

// Keep in sync with footer.css 960px breakpoint.
const isDesktop = window.matchMedia('(min-width: 960px)');

function initBackToTop() {
  if (document.getElementById('back-to-top')) return;

  const wrap = document.createElement('div');
  wrap.id = 'back-to-top';
  const btn = document.createElement('a');
  btn.href = '#';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = CHEVRON_UP;
  wrap.append(btn);
  document.body.append(wrap);

  const toggle = () => {
    wrap.classList.toggle('is-visible', isDesktop.matches && window.scrollY > 200);
  };
  window.addEventListener('scroll', toggle, { passive: true });
  isDesktop.addEventListener('change', toggle);
  toggle();

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isDesktop.matches) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

initBackToTop();
