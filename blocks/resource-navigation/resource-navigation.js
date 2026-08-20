import { loadFragment } from '../fragment/fragment.js';

const FRAGMENT_PATH = '/fragments/resource-center-navigation';

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
  block.append(navigation);
  block.hidden = false;
}
