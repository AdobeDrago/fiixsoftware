import { expect, test } from '@playwright/test';

const PRODUCT_PAGE_PATH = '/cmms/cmms-software';

const PRODUCT_BLOCKS = [
  'hero-lead',
  'columns-logos',
  'cards-features',
  'cards-video',
  'columns-media',
  'cards-testimonial',
  'carousel-testimonial',
  'cards-cta',
  'accordion-faq',
];

async function openProductPage(page) {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const response = await page.goto(PRODUCT_PAGE_PATH, { waitUntil: 'domcontentloaded' });
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

test.describe('CMMS product page', () => {
  test('responds successfully and exposes the essential document metadata', async ({ page }) => {
    await openProductPage(page);

    await expect(page).toHaveTitle(/CMMS Maintenance Software/i);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /cmms\/cmms-software/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /CMMS/i);
  });

  test('renders the product hero and its responsive lead CTA', async ({ page }, testInfo) => {
    await openProductPage(page);

    const hero = page.locator('.pf-hero .hero-lead').first();
    await expect(hero).toBeVisible();
    await expect(hero.getByRole('heading', { level: 1, name: /CMMS maintenance software/i })).toBeVisible();

    if (testInfo.project.name === 'Mobile Chrome') {
      await expect(hero.getByRole('link', { name: /request a demo/i })).toHaveAttribute('href', /demo-request/);
    } else {
      const email = hero.locator('input[type="email"]');
      await expect(email).toBeVisible();
      await expect(email).toHaveAccessibleName(/company email/i);
      await email.fill('test@example.com');
      await expect(hero.getByRole('button', { name: /try it for free/i })).toBeVisible();
    }
  });

  test('loads the product-template content blocks', async ({ page }) => {
    await openProductPage(page);

    await Promise.all(PRODUCT_BLOCKS.map(async (blockName) => {
      await expect(page.locator(`main .${blockName}`).first()).toBeVisible();
    }));

    const featureCards = page.locator('.cards-features').first().locator(':scope > ul > li');
    expect(await featureCards.count()).toBeGreaterThanOrEqual(3);
  });

  test('keeps product links actionable and accordion items exclusive', async ({ page }) => {
    await openProductPage(page);
    await expectAllLinksToHaveDestinations(page, 'main');

    const accordion = page.locator('.accordion-faq').first();
    await accordion.scrollIntoViewIfNeeded();
    const items = accordion.locator('details.accordion-faq-item');
    expect(await items.count()).toBeGreaterThan(1);

    const firstItem = items.first();
    const secondItem = items.nth(1);
    await expect(firstItem).toHaveAttribute('open', '');
    await secondItem.locator('summary').click();
    await expect(secondItem).toHaveAttribute('open', '');
    await expect(firstItem).not.toHaveAttribute('open', '');
  });

  test('renders usable testimonial controls without uncaught page errors', async ({ page }) => {
    const pageErrors = await openProductPage(page);

    const testimonials = page.locator('.carousel-testimonial').first();
    await testimonials.scrollIntoViewIfNeeded();
    await expect(testimonials).toHaveAttribute('role', 'region');
    await expect(testimonials.getByRole('button', { name: /next slide/i })).toBeEnabled();
    await expect(testimonials.getByRole('button', { name: /previous slide/i })).toBeEnabled();

    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(page.locator('footer')).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('does not horizontally overflow on mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome', 'Horizontal overflow is assessed at the mobile viewport.');
    await openProductPage(page);
    await page.locator('footer').scrollIntoViewIfNeeded();

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });
});
