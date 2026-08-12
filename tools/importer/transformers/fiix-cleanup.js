/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Fiix Software site-wide cleanup.
 *
 * Removes non-authorable WordPress site chrome and third-party widgets so the
 * import contains only page-level authorable content.
 *
 * Every selector below was verified against migration-work/cleaned.html for the
 * pricing page (https://fiixsoftware.com/cmms/pricing/). No selectors are guessed.
 *   - #onetrust-consent-sdk        cookie consent dialog        (cleaned.html:3628)
 *   - #performance_form            Marketo popup contact form   (cleaned.html:2602, .white-popup.mfp-hide)
 *   - form.mktoForm                standalone Marketo forms     (cleaned.html:3620, 3626)
 *   - #MktoForms2XDIframe          Marketo cross-domain iframe  (cleaned.html:3622)
 *   - #mktoStyleLoaded             Marketo style sentinel nodes (cleaned.html:3618, 3624)
 *   - [id^="batBeacon"]            Bing tracking beacons        (cleaned.html:3615, 3616)
 *   - #ZN_T5isCcF6pxOpZ0B          ZoomInfo tracking container  (cleaned.html:3611)
 *   - #back-to-top                 site-shell scroll widget     (cleaned.html:3605)
 *   - header.siteHeader            site header / navigation     (cleaned.html:5)
 *   - #footer                      site footer                  (cleaned.html:3241)
 *   - #copyright                   footer copyright bar         (cleaned.html:3595)
 * (No Drift chat widget and no <script>/<style>/<noscript> nodes remain in the
 * scraped HTML, so no selectors are emitted for those.)
 *
 * Home page (https://fiixsoftware.com/) additions, verified against the
 * home-page migration-work/cleaned.html:
 *   - #mobile-navigation           standalone mobile menu nav   (cleaned.html:519)
 *     The mobile menu <nav id="mobile-navigation"> is a SIBLING of #mobile-header
 *     (it sits after the #mobile-header div closes and before #page-wrap), so it
 *     is NOT covered by the #mobile-header selector above. It is the collapsed
 *     mobile site navigation — non-authorable shared chrome — and is removed
 *     here so the imported home page keeps only #page-wrap content. Both of the
 *     site's <nav> elements are chrome: the desktop <nav> lives inside
 *     header.siteHeader (removed above) and this mobile <nav> is removed here.
 *     The hero's .home_header > .header.container > .header-flex wrapper is the
 *     hero CONTENT wrapper (headline, subheading, email form, stat metrics, hero
 *     image), not navigation, so it is intentionally left intact for hero-lead.
 *
 * product-feature-page (https://fiixsoftware.com/cmms/cmms-software/) verified
 * against that page's migration-work/cleaned.html. All authorable content lives
 * under #cmms-product inside #page-wrap; the chrome to strip is already covered
 * by the selectors above — no new selectors were required:
 *   - header.siteHeader            site header / navigation     (cleaned.html:5)
 *   - #mobile-header               collapsed mobile header      (cleaned.html:480)
 *   - #mobile-navigation           collapsed mobile menu nav    (cleaned.html:503)
 *   - #footer                      site footer                  (cleaned.html:2397)
 *   - #copyright                   footer copyright bar         (cleaned.html:2751)
 *   - #back-to-top                 site-shell scroll widget     (cleaned.html:2762)
 *   - #mktoStyleLoaded             Marketo style sentinel nodes (cleaned.html:2768, 2782)
 *   - form.mktoForm                hidden Marketo popup forms   (cleaned.html:657, 2778, 2820)
 *   - #MktoForms2XDIframe          Marketo cross-domain iframe  (cleaned.html:2780)
 *   - [id^="batBeacon"]            Bing tracking beacons        (cleaned.html:2786, 2787)
 *   - #onetrust-consent-sdk        cookie consent dialog        (cleaned.html:2789)
 *   - link                         Vidyard lightbox <link>s     (cleaned.html:2770-2777)
 *   The hero's OWN email-capture form <form id="freetour_email"> (cleaned.html:652)
 *   and its .twoStep-form wrapper are authorable hero content (hero-lead) and are
 *   intentionally NOT removed — only the hidden form.mktoForm popups are stripped.
 *   (No Drift/CybotCookiebot/#performance_form/.white-popup/#ZN_.../#contactmap on
 *   this page, so those prior-page selectors are harmless idempotent no-ops here.)
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays, cookie banners, popup forms, and tracking that would otherwise
    // interfere with block parsing. Selectors verified in cleaned.html.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '#performance_form',
      '.white-popup.mfp-hide',
      'form.mktoForm',
      '#MktoForms2XDIframe',
      '#mktoStyleLoaded',
      '[id^="batBeacon"]',
      '#ZN_T5isCcF6pxOpZ0B',
      '#back-to-top',
      // Contact-us page: the interactive Google Map widget is not authorable
      // and its tile <img>s would otherwise leak into the import. Remove only
      // the map div (#contactmap.google_map) — NOT the .contact_map column,
      // which also contains the .contact-location office info. The office
      // parser renders a static "View on Google Maps" link in its place.
      '#contactmap',
      '.google_map',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome handled by auto-loaded header/footer blocks,
    // plus leftover embedded/tracking elements. Selectors verified in cleaned.html.
    WebImporter.DOMUtils.remove(element, [
      'header.siteHeader',
      '#mobile-header',
      '#mobile-navigation',
      '#footer',
      '#copyright',
      'iframe',
      'noscript',
      'link',
    ]);
  }
}
