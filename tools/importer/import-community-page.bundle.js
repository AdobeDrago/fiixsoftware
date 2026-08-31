/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-community-page.js
  var import_community_page_exports = {};
  __export(import_community_page_exports, {
    default: () => import_community_page_default
  });

  // tools/importer/parsers/community-hero.js
  function parse(element, { document }) {
    const summary = element.querySelector(".summary, .intro > div") || element.querySelector(".intro");
    const textCell = [];
    if (summary) {
      Array.from(summary.children).forEach((child) => {
        if (child.textContent.trim() || child.querySelector("a, img")) textCell.push(child);
      });
    }
    const imgs = Array.from(element.querySelectorAll("img"));
    const board = imgs.find((i) => {
      const alt = (i.getAttribute("alt") || "").toLowerCase();
      const decorative = i.getAttribute("aria-hidden") === "true" || i.getAttribute("role") === "presentation";
      return !decorative && !/fiixers logo/.test(alt) && /board|messaging|community/.test(alt);
    }) || imgs.find((i) => i.getAttribute("aria-hidden") !== "true" && !/fiixers logo/i.test(i.getAttribute("alt") || ""));
    if (textCell.length === 0 && !board) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[textCell.length ? textCell : "", board || ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/community-why-join.js
  function parse2(element, { document }) {
    const cards = Array.from(element.querySelectorAll(":scope > .item, .item"));
    if (cards.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cards.forEach((card) => {
      const icon = card.querySelector("figure img, figure picture, img");
      const textCell = [];
      Array.from(card.querySelectorAll(":scope > p")).forEach((p) => textCell.push(p));
      if (!icon && textCell.length === 0) return;
      cells.push([icon || "", textCell.length ? textCell : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-icon", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/community-testimonials.js
  function parse3(element, { document }) {
    const items = Array.from(element.querySelectorAll(":scope > .item, .item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const seen = /* @__PURE__ */ new Set();
    items.forEach((item) => {
      const quote = item.querySelector(":scope > p");
      const key = (quote ? quote.textContent : item.textContent).trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      const headshot = item.querySelector(".review-flex figure img, .review-flex img, figure img");
      const contentCell = [];
      if (quote) contentCell.push(quote);
      const author = item.querySelector(".review-flex p");
      if (author) contentCell.push(author);
      if (!headshot && contentCell.length === 0) return;
      cells.push([headshot || "", contentCell.length ? contentCell : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-testimonial", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/community-cta.js
  function parse4(element, { document }) {
    const container = element.querySelector(".container") || element;
    const heading = container.querySelector("h1, h2, h3");
    const paras = Array.from(container.querySelectorAll(":scope > p"));
    if (!heading && paras.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const contentCell = [];
    if (heading) contentCell.push(heading);
    paras.forEach((p) => contentCell.push(p));
    const cells = [[contentCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-cta", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/fiix-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        "#performance_form",
        ".white-popup.mfp-hide",
        "form.mktoForm",
        "#MktoForms2XDIframe",
        "#mktoStyleLoaded",
        '[id^="batBeacon"]',
        "#ZN_T5isCcF6pxOpZ0B",
        "#back-to-top",
        // Contact-us page: the interactive Google Map widget is not authorable
        // and its tile <img>s would otherwise leak into the import. Remove only
        // the map div (#contactmap.google_map) — NOT the .contact_map column,
        // which also contains the .contact-location office info. The office
        // parser renders a static "View on Google Maps" link in its place.
        "#contactmap",
        ".google_map"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.siteHeader",
        "#mobile-header",
        "#mobile-navigation",
        "#footer",
        "#copyright",
        "iframe",
        "noscript",
        "link"
      ]);
    }
  }

  // tools/importer/transformers/fiix-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function findSectionAnchor(element, selectors) {
    if (!Array.isArray(selectors)) return null;
    for (const selector of selectors) {
      if (!selector) continue;
      const match = element.querySelector(selector);
      if (match) return match;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.beforeTransform) return;
    const template = payload && payload.template;
    const sections = template && template.sections;
    if (!Array.isArray(sections) || sections.length < 2) return;
    const doc = element.ownerDocument;
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const anchor = findSectionAnchor(element, section.selector);
      if (!anchor) {
        console.warn("Section anchor not found for section:", section.id);
        continue;
      }
      if (section.style) {
        const metadataBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (anchor.nextSibling) {
          anchor.parentNode.insertBefore(metadataBlock, anchor.nextSibling);
        } else {
          anchor.parentNode.appendChild(metadataBlock);
        }
      }
      if (i > 0) {
        const hr = doc.createElement("hr");
        anchor.parentNode.insertBefore(hr, anchor);
      }
    }
  }

  // tools/importer/import-community-page.js
  function resolveParser(blockName, selector) {
    if (selector.includes(".intro")) return parse;
    if (selector.includes("join-flex")) return parse2;
    if (selector.includes("quotes")) return parse3;
    if (selector.includes("get-started")) return parse4;
    return null;
  }
  var PAGE_TEMPLATE = {
    name: "community-page",
    description: "The Fiixers community page reusing existing blocks.",
    urls: ["https://fiixsoftware.com/community/"],
    blocks: [
      { name: "columns-media", instances: ["header:has(.intro)"] },
      { name: "cards-icon", instances: [".join-flex"] },
      { name: "carousel-testimonial", instances: [".quotes"] },
      { name: "hero-cta", instances: [".get-started"] }
    ],
    sections: [
      { id: "community-hero", name: "Hero", selector: ["header:has(.intro)"], style: "community-hero", blocks: ["columns-media"], defaultContent: [] },
      { id: "community-why", name: "Why join", selector: ["section:has(.join-flex)"], style: "community-why", blocks: ["cards-icon", "carousel-testimonial"], defaultContent: ["section:has(.join-flex) > .container > h2"] },
      { id: "community-cta", name: "Get started CTA", selector: [".get-started"], style: "community-cta", blocks: ["hero-cta"], defaultContent: [] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_community_page_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = resolveParser(block.name, block.selector);
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name} (${block.selector})`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_community_page_exports);
})();
