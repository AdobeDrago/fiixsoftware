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
 *
 * case-study-page (https://fiixsoftware.com/resource-center/case-studies/universal-pure/)
 * verified against that page's migration-work/cleaned.html. All authorable content
 * lives under div.case-studies-temp.cloeren inside #page-wrap; the chrome to strip is
 * already covered by the selectors above — no new removal selectors were required:
 *   - header.siteHeader            site header / navigation     (cleaned.html:5)
 *   - #mobile-header               collapsed mobile header      (cleaned.html:480)
 *   - #mobile-navigation           collapsed mobile menu nav    (cleaned.html:503)
 *   - #footer                      site footer                  (cleaned.html:774)
 *   - #copyright                   footer copyright bar         (cleaned.html:1133)
 *   - #back-to-top                 site-shell scroll widget     (cleaned.html:1144)
 *   - form.mktoForm                hidden Marketo footer form    (cleaned.html:783)
 *   - iframe / link                Vidyard + Marketo XD iframe   (cleaned.html:716, 1150, 1157)
 *   The case-studies-temp.cloeren > header, div.company-intro (with .ba-fiix
 *   challenge/solution/result columns), the .container.content Company Overview
 *   narrative, and div.kick-the-tires free-tour CTA are all authorable page content
 *   and are left intact for the hero-case-study / columns-media / hero-cta parsers.
 *
 *   Vidyard video handling (beforeTransform, below): the Company Overview narrative
 *   embeds a Vidyard player at div.vidyardVid (cleaned.html:713-721) containing an
 *   <iframe class="vidyard-iframe-..." src="https://play.vidyard.com/6Tkjrp6faThCumu8isjgKx?...">.
 *   This div.vidyardVid is NOT inside any block parser's target (it sits in the
 *   .container.content default-content region, a sibling of .ba-fiix), so no parser
 *   preserves it, and the generic afterTransform `iframe`/`link` removal would delete
 *   the embed entirely — losing the video. It is therefore rewritten in
 *   beforeTransform (before the iframe/link removal) into a standalone paragraph link
 *   pointing at the cleaned player URL (query string stripped) so EDS client-side
 *   auto-blocking can rebuild the video embed. Keyed on the site-generic .vidyardVid
 *   class and guarded by an iframe[src*="play.vidyard.com"] lookup, so it is a no-op
 *   on pages/templates without a Vidyard embed.
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

    // Vidyard embed → standalone link so EDS client-side auto-blocking can rebuild
    // the video. Runs before the afterTransform iframe/link removal that would
    // otherwise delete the embed. div.vidyardVid lives in the Company Overview
    // default-content region (cleaned.html:713), outside any block parser target,
    // so converting it here does not disturb block matching. No-op when absent.
    element.querySelectorAll('div.vidyardVid').forEach((vid) => {
      const iframe = vid.querySelector('iframe[src*="play.vidyard.com"]');
      if (!iframe) return;
      // Strip the query string so the link is a clean canonical player URL.
      const src = iframe.getAttribute('src');
      const url = src.split('?')[0];
      const p = element.ownerDocument.createElement('p');
      const a = element.ownerDocument.createElement('a');
      a.href = url;
      a.textContent = url;
      p.append(a);
      vid.replaceWith(p);
    });

    // Owl-carousel image gallery (div#gallery on older case-study pages, e.g.
    // farming-maintenance). The owl plugin runs at import time and clones slides
    // for infinite looping (6 cloned of 12 items) plus injects prev/next nav
    // (‹ ›) and dot controls. Left as-is this leaks duplicated images, empty
    // .mp4 video-slide links, and a stray "‹›" text node into the import.
    // Collapse #gallery to its unique slide images (document order, deduped by
    // src) so it imports as a clean image list — EDS stacks them without the JS
    // carousel. Keyed on div#gallery and guarded by an image lookup, so it is a
    // no-op on pages/templates without this gallery.
    element.querySelectorAll('div#gallery').forEach((gallery) => {
      const imgs = [];
      const seen = new Set();
      gallery.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
        if (!src || seen.has(src)) return;
        seen.add(src);
        if (!img.getAttribute('src')) img.setAttribute('src', src);
        imgs.push(img);
      });
      if (imgs.length === 0) return;
      const frag = element.ownerDocument.createDocumentFragment();
      imgs.forEach((img) => {
        const p = element.ownerDocument.createElement('p');
        p.append(img);
        frag.append(p);
      });
      gallery.replaceWith(frag);
    });

    // Inline <q> quotations already contain typographic quotation marks in the
    // source (e.g. <q>“…”</q>). The HTML→markdown conversion also wraps <q>
    // content in straight quotes, producing doubled quotes (""…""). Unwrap <q>
    // elements to their inner text so exactly one set of (curly) quotes remains.
    // Generic and safe: a no-op on pages without <q> elements.
    element.querySelectorAll('q').forEach((q) => {
      q.replaceWith(element.ownerDocument.createTextNode(q.textContent));
    });
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
