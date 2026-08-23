const { normalizeText } = require('./normalize.js');

async function extractPage(page, side, config) {
  const rootSelector = config.contentRoots[side];
  const globalSelector = config.globalRoots[side];
  const raw = await page.evaluate(({
    rootSelector: root, globalSelector: globalRoot, exclusions,
  }) => {
    const contentRoot = document.querySelector(root);
    const excluded = (element) => exclusions.some((selector) => (
      element.matches(selector) || element.closest(selector)
    ));
    const visible = (element) => {
      if (!element || excluded(element)) return false;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
    const cleanLinkLabel = (value) => clean(value)
      .replace(/\s*\(opens? in (?:a )?new tab\)\s*$/i, '')
      .trim();
    const contextFor = (element) => {
      const container = element.closest(
        'article, .resource, li[class*="card"], [data-card], section',
      );
      const heading = container?.querySelector('h1,h2,h3,h4,h5,h6');
      if (heading && heading !== element) return clean(heading.innerText);
      if (!contentRoot) return '';
      const headings = [...contentRoot.querySelectorAll('h1,h2,h3,h4,h5,h6')];
      const orderedElements = [...contentRoot.querySelectorAll('*')];
      const elementIndex = orderedElements.indexOf(element);
      const preceding = headings.filter((candidate) => (
        orderedElements.indexOf(candidate) < elementIndex
      ));
      return clean(preceding.at(-1)?.innerText);
    };
    const rectFor = (element) => {
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };
    const content = contentRoot ? [...contentRoot.querySelectorAll(
      'h1,h2,h3,h4,h5,h6,p,blockquote,cite,li,dt,dd,figcaption,label,button,[role="button"]',
    )]
      .filter(visible)
      .filter((element) => {
        const quote = element.closest('blockquote');
        return !quote || quote === element;
      })
      .filter((element) => !(
        element.matches('li')
        && element.querySelector(
          'h1,h2,h3,h4,h5,h6,p,blockquote,cite,li,dt,dd,figcaption,button',
        )
      ))
      .filter((element) => !(
        element.matches('p')
        && element.querySelector(':scope > a[href]')
        && [...element.children].every((child) => child.matches('a[href]') || excluded(child))
      ))
      .flatMap((element) => {
        const textSegments = element.matches('blockquote')
          ? String(element.innerText || element.textContent || '')
            .split(/\n+/)
            .map(clean)
            .filter(Boolean)
          : [clean(element.innerText || element.textContent)];
        let kind = 'text';
        if (/^H[1-6]$/.test(element.tagName)) kind = 'heading';
        else if (element.matches('li,dt,dd')) kind = 'list-item';
        else if (element.matches('button,[role="button"]')) kind = 'button';
        else if (element.matches('label')) kind = 'label';
        else if (element.matches('figcaption')) kind = 'caption';
        else kind = 'paragraph';
        return textSegments.map((text) => ({
          kind: element.matches('blockquote,cite') ? 'paragraph' : kind,
          tag: element.tagName,
          text,
          context: contextFor(element),
          rect: rectFor(element),
        }));
      })
      .map((item, order) => ({ ...item, order }))
      .filter((item) => item.text) : [];

    const extractLinks = (scopeRoot, scope) => (scopeRoot ? [...scopeRoot.querySelectorAll('a[href]')]
      .filter(visible)
      .map((element, order) => ({
        label: cleanLinkLabel(
          element.querySelector('.resource-list-card-cta')?.innerText
          || element.innerText
          || element.getAttribute('aria-label')
          || element.getAttribute('title')
          || element.querySelector('img')?.alt,
        ),
        href: element.href,
        rawHref: element.getAttribute('href'),
        context: contextFor(element),
        order,
        scope,
        target: element.target || null,
      }))
      .filter((item) => item.rawHref && !item.rawHref.startsWith('#')) : []);
    const links = extractLinks(contentRoot, 'content');
    document.querySelectorAll(globalRoot).forEach((scopeRoot) => {
      links.push(...extractLinks(scopeRoot, 'global'));
    });

    const images = contentRoot ? [...contentRoot.querySelectorAll('img')]
      .filter(visible)
      .map((element, order) => ({
        type: 'image',
        src: element.src || null,
        currentSrc: element.currentSrc || null,
        srcset: element.srcset || null,
        pictureSources: [...(element.closest('picture')?.querySelectorAll('source') || [])]
          .map((source) => source.srcset)
          .filter(Boolean),
        alt: element.alt || '',
        context: contextFor(element),
        width: element.naturalWidth,
        height: element.naturalHeight,
        renderedWidth: Math.round(element.getBoundingClientRect().width),
        renderedHeight: Math.round(element.getBoundingClientRect().height),
        complete: element.complete,
        loaded: element.complete && element.naturalWidth > 0,
        decorative: element.alt === '' || element.getAttribute('role') === 'presentation',
        order,
      })) : [];
    if (contentRoot) {
      [...contentRoot.querySelectorAll('*')].filter(visible).forEach((element) => {
        if (element.matches('img,picture,source')) return;
        const background = getComputedStyle(element).backgroundImage;
        const match = background.match(/url\(["']?(.+?)["']?\)/);
        const rect = element.getBoundingClientRect();
        if (!match || rect.width < 48 || rect.height < 48) return;
        images.push({
          type: 'background',
          src: new URL(match[1], window.location.href).href,
          currentSrc: null,
          srcset: null,
          pictureSources: [],
          alt: '',
          context: contextFor(element),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          renderedWidth: Math.round(rect.width),
          renderedHeight: Math.round(rect.height),
          loaded: true,
          decorative: true,
          order: images.length,
        });
      });
    }

    const metadata = {
      title: document.title || null,
      description: document.querySelector('meta[name="description"]')?.content || null,
      canonical: document.querySelector('link[rel="canonical"]')?.href || null,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content || null,
      ogDescription: document.querySelector('meta[property="og:description"]')?.content || null,
      ogUrl: document.querySelector('meta[property="og:url"]')?.content || null,
      ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
      twitterCard: document.querySelector('meta[name="twitter:card"]')?.content || null,
      twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content || null,
      twitterDescription: document.querySelector('meta[name="twitter:description"]')?.content || null,
      twitterImage: document.querySelector('meta[name="twitter:image"]')?.content || null,
    };
    const menuAffordances = [...document.querySelectorAll(
      'button[aria-label*="menu" i], button[class*="menu"], [id*="mobile-navigation-btn"], [class*="hamburger"]',
    )].filter(visible).length;
    const visibleNavigation = [...document.querySelectorAll('header nav, nav[aria-label], .siteHeader nav')]
      .filter(visible).length;
    return {
      rootExists: Boolean(contentRoot),
      content,
      links,
      images,
      metadata,
      layout: {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        horizontalOverflow: Math.max(
          0,
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
        menuAffordances,
        visibleNavigation,
      },
    };
  }, {
    rootSelector,
    globalSelector,
    exclusions: config.excludeSelectors,
  });

  raw.content = raw.content.map((item) => ({
    ...item,
    normalized: normalizeText(item.text, { lowercase: true }),
  }));
  return raw;
}

module.exports = { extractPage };
