/* eslint-disable */
/* global WebImporter */

/**
 * Decomposes a legacy case-study company intro into reusable EDS blocks while
 * preserving source order. Handles logo-only, copy-first, one-or-more profile,
 * challenge/solution/result, and YouTube-video variations.
 */
export default function parse(element, { document }) {
  const container = element.querySelector(':scope > .container') || element;
  const output = [];
  const children = Array.from(element.children).flatMap((child) => (
    child === container ? Array.from(container.children) : [child]
  ));

  const createBlock = (name, cells) => WebImporter.Blocks.createBlock(document, { name, cells });
  const flushProfiles = (cells) => {
    if (cells.length) output.push(createBlock('case-study-profiles', cells));
  };
  const isLogo = (node) => node.matches('figure.large-logo');
  const isProfile = (node) => node.matches('.intro-flex');
  const isLead = (node) => node.matches('p');
  const isStats = (node) => node.matches('.stats-multi');
  const isSolutionsComparison = (node) => node.matches('.solutions');
  const getLogoBlockName = (logo) => {
    const sourceWidth = Number.parseFloat(logo.ownerDocument.defaultView?.getComputedStyle(logo).width);
    if (sourceWidth >= 280) return 'case-study-logo (large)';
    if (sourceWidth >= 200) return 'case-study-logo (wide)';
    return 'case-study-logo';
  };
  const getYoutubeIframe = (node) => (
    node.matches('iframe[src*="youtube.com"], iframe[src*="youtu.be"]')
      ? node
      : node.querySelector('iframe[src*="youtube.com"], iframe[src*="youtu.be"]')
  );
  const createYoutubeBlock = (iframe) => {
    const link = document.createElement('a');
    const title = iframe.title.trim();
    link.href = iframe.src;
    link.textContent = iframe.src;
    return createBlock('youtube-video', [title ? [link, title] : [link]]);
  };
  const createStatsBlock = (stats) => {
    const cells = Array.from(stats.children).map((item) => {
      const fields = Array.from(item.children).filter((field) => field.textContent.trim());
      return fields.slice(0, 2);
    });
    return createBlock('stats-multi', cells);
  };
  const createSolutionsComparisonBlock = (solutions) => {
    const cells = Array.from(solutions.querySelectorAll(':scope > .icon-group')).map((item) => {
      const solution = item.querySelector(':scope > div');
      const icon = item.querySelector(':scope > .timeline-icon');
      const result = item.querySelector(':scope > p');
      return [solution || '', icon || '', result || ''];
    }).filter((row) => row.some((cell) => cell !== ''));
    return cells.length ? createBlock('solutions-comparison', cells) : null;
  };

  for (let index = 0; index < children.length;) {
    const child = children[index];

    if (isLogo(child)) {
      output.push(createBlock(getLogoBlockName(child), [[child]]));
      index += 1;
      continue;
    }

    if (isLead(child)) {
      const cells = [];
      while (children[index] && isLead(children[index])) {
        cells.push([children[index]]);
        index += 1;
      }
      output.push(createBlock('case-study-lead', cells));
      continue;
    }

    if (isProfile(child)) {
      const cells = [];
      while (children[index] && isProfile(children[index])) {
        const profile = children[index];
        const image = profile.querySelector(':scope > figure, :scope > picture, :scope > img');
        const details = Array.from(profile.children).find((node) => node !== image && node.textContent.trim());
        if (image && details) {
          cells.push([image, details]);
        } else {
          flushProfiles(cells);
          cells.length = 0;
          output.push(profile);
        }
        index += 1;
      }
      flushProfiles(cells);
      continue;
    }

    if (isStats(child)) {
      output.push(createStatsBlock(child));
      index += 1;
      continue;
    }

    if (isSolutionsComparison(child)) {
      const block = createSolutionsComparisonBlock(child);
      if (block) output.push(block);
      index += 1;
      continue;
    }

    const iframe = getYoutubeIframe(child);
    if (iframe) {
      output.push(createYoutubeBlock(iframe));
      index += 1;
      continue;
    }

    output.push(child);
    index += 1;
  }

  element.replaceWith(...output);
}
