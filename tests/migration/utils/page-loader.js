const BLOCKED_HOST_PATTERNS = [
  /(^|\.)google-analytics\.com$/i,
  /(^|\.)googletagmanager\.com$/i,
  /(^|\.)hotjar\.com$/i,
  /(^|\.)driftt\.com$/i,
  /(^|\.)comparesoft\.com$/i,
  /(^|\.)doubleclick\.net$/i,
  /(^|\.)munchkin\.marketo\.net$/i,
  /^analytics\.google\.com$/i,
  /^bat\.bing\.com$/i,
  /(^|\.)clarity\.ms$/i,
  /(^|\.)cookielaw\.org$/i,
  /(^|\.)onetrust\.com$/i,
  /^px\.ads\.linkedin\.com$/i,
  /^snap\.licdn\.com$/i,
  /^(?:prompts|snippet)\.maze\.co$/i,
  /^ipgeolocation\.abstractapi\.com$/i,
];

function isBlockedHost(hostname) {
  return BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

async function installRoutes(context) {
  await context.route('**/*', async (route) => {
    const requestUrl = new URL(route.request().url());
    if (isBlockedHost(requestUrl.hostname)) {
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
}

async function stabilizePage(page, config) {
  const selectors = config.maskSelectors.join(',');
  if (selectors) {
    await page.addStyleTag({ content: `${selectors} { display: none !important; visibility: hidden !important; }` });
  }
  await page.addStyleTag({
    content: `
    *, *::before, *::after {
      animation-delay: 0s !important;
      animation-duration: 0s !important;
      animation-iteration-count: 1 !important;
      caret-color: transparent !important;
      scroll-behavior: auto !important;
      transition-delay: 0s !important;
      transition-duration: 0s !important;
    }
  `,
  });
  if (/Index Page$/.test(config.pageType || '')) {
    await page.evaluate(async () => {
      const wait = (duration) => new Promise((resolve) => {
        setTimeout(resolve, duration);
      });
      await [0.25, 0.5, 0.75, 1].reduce((sequence, fraction) => (
        sequence.then(async () => {
          window.scrollTo(0, document.documentElement.scrollHeight * fraction);
          await wait(120);
        })
      ), Promise.resolve());
      window.scrollTo(0, 0);
    });
  }
  await page.evaluate(async () => {
    const pageImages = [...document.images];
    pageImages.forEach((image) => {
      if (image.loading === 'lazy') image.loading = 'eager';
    });
    const timeout = new Promise((resolve) => {
      setTimeout(resolve, 12000);
    });
    const fonts = document.fonts?.ready || Promise.resolve();
    const images = Promise.all(pageImages.map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
        image.decode?.().then(resolve).catch(() => {
          if (image.complete) resolve();
        });
      });
    }));
    await Promise.race([Promise.all([fonts, images]), timeout]);
  });

  async function waitForStableHeight(attempt = 0, previousHeight = -1, stableSamples = 0) {
    if (attempt >= 8 || stableSamples >= 2) return;
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const nextSamples = Math.abs(height - previousHeight) <= 2 ? stableSamples + 1 : 0;
    await page.waitForTimeout(350);
    await waitForStableHeight(attempt + 1, height, nextSamples);
  }
  await waitForStableHeight();
}

async function loadPage(page, url, config) {
  let response = null;
  let error = null;
  try {
    response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await stabilizePage(page, config);
  } catch (caught) {
    error = caught.message;
  }
  return {
    requestedUrl: url,
    finalUrl: page.url(),
    status: response?.status() || null,
    ok: Boolean(response?.ok()),
    error,
  };
}

async function openPair(browser, config, viewport) {
  const contextOptions = {
    viewport,
    colorScheme: 'light',
    locale: 'en-US',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  };
  const liveContext = await browser.newContext(contextOptions);
  const edsContext = await browser.newContext(contextOptions);
  await Promise.all([installRoutes(liveContext), installRoutes(edsContext)]);
  const [livePage, edsPage] = await Promise.all([liveContext.newPage(), edsContext.newPage()]);
  const [liveLoad, edsLoad] = await Promise.all([
    loadPage(livePage, config.live, config),
    loadPage(edsPage, config.eds, config),
  ]);
  return {
    liveContext,
    edsContext,
    livePage,
    edsPage,
    liveLoad,
    edsLoad,
    async close() {
      await Promise.all([liveContext.close(), edsContext.close()]);
    },
  };
}

module.exports = {
  isBlockedHost, loadPage, openPair, stabilizePage,
};
