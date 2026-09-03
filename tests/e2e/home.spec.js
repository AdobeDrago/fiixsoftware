import { expect, test } from '@playwright/test';

const HOME_BLOCKS = [
  'hero-lead',
  'columns-logos',
  'tabs-feature',
  'cards-video',
  'carousel-testimonial',
  'cards-cta',
];

async function openHome(page) {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('main')).toBeVisible();

  return pageErrors;
}

async function expectAllLinksToHaveDestinations(page, scope = 'body') {
  const invalidLinks = await page.locator(`${scope} a`).evaluateAll((links) => links
    .filter((link) => !link.closest('[aria-hidden="true"]'))
    .filter((link) => {
      const href = link.getAttribute('href')?.trim();
      return !href || href === '#';
    })
    .map((link) => link.textContent.trim() || link.getAttribute('aria-label') || '<unlabelled link>'));

  expect(invalidLinks).toEqual([]);
}

test.describe('home page', () => {
  test('responds successfully and exposes the essential document metadata', async ({ page }) => {
    await openHome(page);

    await expect(page).toHaveTitle(/\S/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\S/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /\S/);
  });

  test('has one visible primary heading and a main landmark', async ({ page }) => {
    await openHome(page);

    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main h1')).toBeVisible();
  });

  test('loads every block required by the home-page content model', async ({ page }) => {
    await openHome(page);

    await Promise.all(HOME_BLOCKS.map(async (blockName) => {
      await expect(page.locator(`main .${blockName}`).first()).toBeVisible();
    }));
  });

  test('renders a labelled hero email capture and call to action', async ({ page }) => {
    await openHome(page);

    const hero = page.locator('.hero-lead').first();
    const email = hero.locator('input[type="email"]');
    await expect(email).toBeVisible();
    await expect(email).toHaveAccessibleName(/email/i);
    await email.fill('test@example.com');
    await expect(hero.getByRole('button').first()).toBeVisible();
  });

  test('provides a usable header and footer navigation', async ({ page }) => {
    await openHome(page);

    const headerNavigation = page.locator('header nav');
    await expect(headerNavigation).toBeVisible();
    await expect(headerNavigation.getByRole('link').first()).toBeVisible();
    await expectAllLinksToHaveDestinations(page, 'header');

    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link').first()).toBeVisible();
    await expectAllLinksToHaveDestinations(page, 'footer');
  });

  test('desktop mega menu opens and closes with Escape', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Desktop Chrome', 'The mega menu is only visible at desktop widths.');
    await openHome(page);

    const menu = page.locator('header .nav-drop').first();
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  });

  test('mobile navigation opens and closes with the keyboard', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'This interaction is specific to the mobile menu.');
    await openHome(page);

    const navigation = page.locator('header nav');
    const menuButton = page.getByRole('button', { name: 'Open navigation' });
    await expect(menuButton).toBeVisible();

    await menuButton.click();
    await expect(navigation).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(navigation).toHaveAttribute('aria-expanded', 'false');
    await expect(menuButton).toHaveAccessibleName('Open navigation');
  });

  test('feature tabs switch their active panel', async ({ page }) => {
    test.skip(test.info().project.name !== 'Desktop Chrome', 'Feature tabs are not displayed at the mobile breakpoint.');
    await openHome(page);

    const tablist = page.locator('.tabs-feature-list').first();
    await expect(tablist).toBeVisible();
    const tabs = tablist.locator('.tabs-feature-tab');
    expect(await tabs.count()).toBeGreaterThan(1);

    const secondTab = tabs.nth(1);
    const panelId = await secondTab.getAttribute('aria-controls');
    await secondTab.click();
    await expect(secondTab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator(`#${panelId}`)).toHaveAttribute('aria-hidden', 'false');
  });

  test('shows accessible video and testimonial carousel controls', async ({ page }) => {
    await openHome(page);

    const videoCards = page.locator('.cards-video').first();
    await videoCards.scrollIntoViewIfNeeded();
    await expect(videoCards.locator('li').first()).toBeVisible();

    const testimonials = page.locator('.carousel-testimonial').first();
    await testimonials.scrollIntoViewIfNeeded();
    await expect(testimonials).toHaveAttribute('role', 'region');
    await expect(testimonials.locator('.slide-next')).toBeEnabled();
    await expect(testimonials.locator('.slide-prev')).toBeEnabled();
  });

  test('shows the dual CTA panels with actionable links', async ({ page }) => {
    await openHome(page);

    const ctas = page.locator('.cards-cta').first();
    await ctas.scrollIntoViewIfNeeded();
    expect(await ctas.locator('.cards-cta-panel').count()).toBeGreaterThanOrEqual(2);
    await expect(ctas.locator('.cards-cta-button').first()).toBeVisible();
    await expectAllLinksToHaveDestinations(page, '.cards-cta');
  });

  test('has no empty links or broken eagerly loaded images', async ({ page }) => {
    await openHome(page);
    await expectAllLinksToHaveDestinations(page, 'main');

    const brokenImages = await page.locator('img:not([loading="lazy"])').evaluateAll((images) => images
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.getAttribute('src')));
    expect(brokenImages).toEqual([]);
  });

  test('does not emit uncaught page errors while rendering', async ({ page }) => {
    const pageErrors = await openHome(page);
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(page.locator('footer')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('does not horizontally overflow on mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'Horizontal overflow is assessed at the mobile viewport.');
    await openHome(page);
    await page.locator('footer').scrollIntoViewIfNeeded();

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });
});
