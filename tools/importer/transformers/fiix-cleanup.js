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
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome handled by auto-loaded header/footer blocks,
    // plus leftover embedded/tracking elements. Selectors verified in cleaned.html.
    WebImporter.DOMUtils.remove(element, [
      'header.siteHeader',
      '#footer',
      '#copyright',
      'iframe',
      'noscript',
      'link',
    ]);
  }
}
