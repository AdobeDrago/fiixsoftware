import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// Inline social icons (match the Fiix footer "Follow" row). Keyed by the
// destination host so authored links keep their real hrefs; only the visual
// presentation (text label -> icon) changes.
const SOCIAL_ICONS = {
  youtube: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.3 8.3L23.3 22h-6.8l-5.3-6.9L5.1 22H2l7.8-8.9L1 2h7l4.8 6.3L18.9 2Zm-1.2 18h1.9L7.1 4H5.1l12.6 16Z"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-7.3 8.3L23.3 22h-6.8l-5.3-6.9L5.1 22H2l7.8-8.9L1 2h7l4.8 6.3L18.9 2Zm-1.2 18h1.9L7.1 4H5.1l12.6 16Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0ZM.24 8.25h4.5V24h-4.5V8.25ZM8.5 8.25H12.8v2.15h.06c.6-1.1 2.06-2.26 4.24-2.26 4.54 0 5.38 2.98 5.38 6.86V24h-4.5v-6.99c0-1.67-.03-3.82-2.33-3.82-2.33 0-2.69 1.82-2.69 3.7V24H8.5V8.25Z"/></svg>',
};

/** Match a social link's host to an icon + accessible label. */
function socialFor(href) {
  const h = (href || '').toLowerCase();
  if (h.includes('youtube')) return { icon: SOCIAL_ICONS.youtube, label: 'YouTube' };
  if (h.includes('twitter') || h.includes('x.com')) return { icon: SOCIAL_ICONS.x, label: 'X' };
  if (h.includes('linkedin')) return { icon: SOCIAL_ICONS.linkedin, label: 'LinkedIn' };
  return null;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Newsletter: production shows an inline email capture (email field + Join
  // button) in place of the authored "Subscribe" link. Build a static form
  // that matches the production look; the authored link's href is preserved as
  // the form action so the control still points at the newsletter page.
  const newsletter = footer.firstElementChild;
  if (newsletter) {
    const subscribe = [...newsletter.querySelectorAll('a')]
      .find((a) => /subscribe/i.test(a.textContent));
    if (subscribe) {
      const action = subscribe.getAttribute('href') || '/newsletter/';
      const form = document.createElement('form');
      form.className = 'footer-newsletter-form';
      form.setAttribute('action', action);
      form.setAttribute('method', 'get');
      const input = document.createElement('input');
      input.type = 'email';
      input.className = 'footer-newsletter-input';
      input.placeholder = "What's your email?";
      input.setAttribute('aria-label', 'Email address');
      const submit = document.createElement('button');
      submit.type = 'submit';
      submit.className = 'footer-newsletter-submit';
      submit.textContent = 'Join';
      form.append(input, submit);
      // replace the paragraph that wrapped the Subscribe link
      (subscribe.closest('p') || subscribe).replaceWith(form);
    }
  }

  // Follow row: render the social links as icons (keep hrefs + add aria-labels).
  const socialP = [...footer.querySelectorAll('p')]
    .find((p) => p.querySelector('a[href*="youtube"], a[href*="twitter"], a[href*="linkedin"]'));
  if (socialP) {
    socialP.classList.add('footer-social');
    socialP.querySelectorAll('a').forEach((a) => {
      const s = socialFor(a.getAttribute('href'));
      if (!s) return;
      a.setAttribute('aria-label', s.label);
      a.setAttribute('title', s.label);
      a.innerHTML = s.icon;
    });
  }

  block.append(footer);
}
