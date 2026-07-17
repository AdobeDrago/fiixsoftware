// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';

export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-feature-list';
  tablist.setAttribute('role', 'tablist');

  // decorate tabs and tabpanels
  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-feature-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-feature-tab';
    button.id = `tab-${id}`;

    button.innerHTML = tab.innerHTML;

    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();

    // tag panel content for styling hooks (no behavioral change):
    // the media paragraph (screenshot/video) vs. the trailing stat/quote note
    const content = tabpanel.firstElementChild;
    if (content) {
      const paras = [...content.querySelectorAll(':scope > p')];
      const isMedia = (p) => p.querySelector('picture, img');
      // bare file-asset links (e.g. .mp4/.webm) are media placeholders,
      // not real text — treat them like media so they don't style as copy
      const isAssetLink = (p) => {
        const a = p.querySelector('a');
        return a && a.getAttribute('href') && /\.(mp4|webm|mov|m4v)$/i.test(a.getAttribute('href'));
      };
      const mediaPara = paras.find((p) => isMedia(p) || isAssetLink(p));
      if (mediaPara) mediaPara.classList.add('tabs-feature-media');
      const textParas = paras.filter((p) => !isMedia(p) && !isAssetLink(p));
      const cta = textParas.find((p) => p.querySelector('a'));
      if (cta) cta.classList.add('tabs-feature-cta');
      // stat/quote note = trailing text paragraph AFTER the CTA (a distinct
      // supporting line). Skip when the only copy is the description itself.
      const ctaIndex = cta ? textParas.indexOf(cta) : -1;
      const note = ctaIndex >= 0
        ? textParas.slice(ctaIndex + 1).filter((p) => !p.querySelector('a')).pop()
        : null;
      if (note) note.classList.add('tabs-feature-note');
    }
  });

  block.prepend(tablist);
}
