import { loadFragment } from '../fragment/fragment.js';

const FRAGMENT_PATH = '/fragments/resource-center-navigation';

function addMobileSelects(navigation) {
  navigation.querySelectorAll('h2, h3, h4').forEach((heading) => {
    const list = heading.nextElementSibling;
    if (!list || list.tagName !== 'UL' || !list.querySelector('a[href]')) return;

    list.classList.add('resource-navigation-list');
    const select = document.createElement('select');
    select.className = 'resource-navigation-select';
    select.setAttribute('aria-label', heading.textContent.trim());

    const placeholder = document.createElement('option');
    placeholder.textContent = 'Select...';
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.append(placeholder);

    list.querySelectorAll('a[href]').forEach((link) => {
      const option = document.createElement('option');
      option.textContent = link.textContent.trim();
      option.value = link.href;
      select.append(option);
    });

    select.addEventListener('change', () => {
      if (select.value) window.location.href = select.value;
    });
    list.before(select);
  });
}

function markBackLink(navigation) {
  const backLink = [...navigation.querySelectorAll('a[href]')]
    .find((link) => link.textContent.trim().toLowerCase().includes('back'));
  backLink?.closest('p')?.classList.add('resource-navigation-back');
}

function removeBackLinkOnResourceIndex(navigation) {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/resource-center') {
    navigation.querySelector('.resource-navigation-back')?.remove();
  }
}

/**
 * Loads and decorates the centrally managed resource navigation.
 * @param {Element} block The resource navigation block element
 */
export default async function decorate(block) {
  let fragment;
  try {
    fragment = await loadFragment(FRAGMENT_PATH);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`[resource-navigation] failed to load ${FRAGMENT_PATH}`, error);
  }

  block.replaceChildren();

  if (!fragment || !fragment.childElementCount) {
    block.hidden = true;
    // eslint-disable-next-line no-console
    console.warn(`[resource-navigation] no fragment found at ${FRAGMENT_PATH}`);
    return;
  }

  const navigation = document.createElement('nav');
  navigation.setAttribute('aria-label', 'Resource center navigation');
  navigation.append(...fragment.children);
  markBackLink(navigation);
  removeBackLinkOnResourceIndex(navigation);
  addMobileSelects(navigation);
  block.append(navigation);
  block.hidden = false;
}
