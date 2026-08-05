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

  // tools/importer/import-premium-support-page.js
  var import_premium_support_page_exports = {};
  __export(import_premium_support_page_exports, {
    default: () => import_premium_support_page_default
  });

  // tools/importer/parsers/premium-hero.js
  function parse(element, { document }) {
    const intro = element.querySelector(".intro > div") || element.querySelector(".intro");
    const textCell = [];
    if (intro) {
      Array.from(intro.children).forEach((child) => {
        if (child.textContent.trim() || child.querySelector("a, img")) textCell.push(child);
      });
    }
    const poster = element.querySelector("img");
    if (textCell.length === 0 && !poster) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[textCell.length ? textCell : "", poster || ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/premium-benefits-cards.js
  function parse2(element, { document }) {
    const grid = element.querySelector(".cont.training, .cont") || element;
    const cards = Array.from(grid.querySelectorAll(":scope > div"));
    if (cards.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cards.forEach((card) => {
      const icon = card.querySelector("figure img, figure picture, img");
      const textCell = [];
      const heading = card.querySelector("h1, h2, h3, h4");
      if (heading) textCell.push(heading);
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

  // tools/importer/parsers/premium-compare-lists.js
  function parse3(element, { document }) {
    const options = element.querySelector(".support-options") || element;
    const columns = Array.from(options.querySelectorAll(":scope > div")).filter((c) => c.textContent.trim().length > 0);
    if (columns.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [columns.map((col) => col)];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/premium-team-carousel.js
  function parse4(element, { document }) {
    const owlItems = Array.from(element.querySelectorAll(".owl-item:not(.cloned) > .item"));
    const items = owlItems.length ? owlItems : Array.from(element.querySelectorAll(":scope .item, .item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const seen = /* @__PURE__ */ new Set();
    items.forEach((item) => {
      const headshot = item.querySelector(".headshot img, .headshot picture");
      const nameEl = item.querySelector(".person_feature strong, .person_feature p");
      const key = (nameEl ? nameEl.textContent : item.textContent).trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      const contentCell = [];
      const info = item.querySelector(".person_feature > div");
      if (info) Array.from(info.querySelectorAll("p")).forEach((p) => contentCell.push(p));
      const quote = item.querySelector(".quote, p.quote");
      if (quote) contentCell.push(quote);
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

  // tools/importer/parsers/premium-success.js
  function parse5(element, { document }) {
    const info = element.querySelector(".info-container");
    const list = element.querySelector(".check-list, ul");
    const infoCell = [];
    if (info) {
      Array.from(info.children).forEach((child) => {
        if (child.textContent.trim() || child.querySelector("a")) infoCell.push(child);
      });
    }
    const listCell = [];
    if (list) {
      list.querySelectorAll("span.check, span:empty").forEach((s) => s.remove());
      listCell.push(list);
    }
    if (infoCell.length === 0 && listCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[infoCell.length ? infoCell : "", listCell.length ? listCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/premium-cta.js
  function parse6(element, { document }) {
    const heading = element.querySelector("h1, h2, h3");
    const paras = Array.from(element.querySelectorAll(":scope > p"));
    element.querySelectorAll(".__cf_email__").forEach((span) => {
      span.replaceWith(document.createTextNode("sales@fiixsoftware.com"));
    });
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

  // tools/importer/parsers/premium-benefits-table.js
  function parse7(element, { document }) {
    const COLS = 3;
    const table = element.querySelector("table");
    if (!table) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const rows = Array.from(table.querySelectorAll(":scope > tbody > tr, :scope > thead > tr, :scope > tr"));
    if (rows.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const makeMarker = () => {
      const span = document.createElement("span");
      span.textContent = "\u2713";
      return span;
    };
    const labelText = (cell) => {
      const clone = cell.cloneNode(true);
      clone.querySelectorAll(".sr-only, i, span:empty").forEach((n) => n.remove());
      return clone.textContent.replace(/\s+/g, " ").trim();
    };
    const cells = [];
    rows.forEach((tr) => {
      const rowCells = Array.from(tr.children);
      if (rowCells.length === 0) return;
      const isHeader = rowCells.every((c) => c.tagName === "TH");
      if (isHeader) {
        const row2 = rowCells.slice(0, COLS).map((c) => {
          const strong = document.createElement("strong");
          strong.textContent = labelText(c);
          return strong;
        });
        while (row2.length < COLS) row2.push("");
        cells.push(row2);
        return;
      }
      const row = [labelText(rowCells[0]) || ""];
      for (let i = 1; i < COLS; i += 1) {
        const planCell = rowCells[i];
        let included = false;
        if (planCell) {
          const sr = planCell.querySelector(".sr-only");
          if (sr) {
            included = !/does not include/i.test(sr.textContent);
          } else {
            included = !!planCell.querySelector('i.fa-check, [class*="fa-check"]');
          }
        }
        row.push(included ? makeMarker() : "");
      }
      while (row.length < COLS) row.push("");
      cells.push(row);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "table-compare", cells });
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

  // tools/importer/import-premium-support-page.js
  function resolveParser(blockName, selector) {
    if (selector.includes(":not(.support-flex)")) return parse7;
    if (selector.includes("header")) return parse;
    if (selector.includes("support-flex")) return parse3;
    if (selector.includes("get-started")) return parse5;
    if (selector.includes(".started")) return parse2;
    if (selector.includes("mh-slider")) return parse4;
    if (selector.includes("contact-sales")) return parse6;
    return null;
  }
  var PAGE_TEMPLATE = {
    name: "premium-support-page",
    description: "Premium Support page reusing existing blocks.",
    urls: ["https://fiixsoftware.com/premium-support/"],
    blocks: [
      { name: "columns-media", instances: [".premium-support > header", ".support-scaling.support-flex", ".get-started"] },
      { name: "cards-icon", instances: [".started"] },
      { name: "carousel-testimonial", instances: [".support-team .mh-slider"] },
      { name: "hero-cta", instances: [".contact-sales"] },
      { name: "table-compare", instances: [".support-scaling:not(.support-flex)"] }
    ],
    sections: [
      { id: "premium-hero", name: "Hero", selector: [".page-section"], style: "premium-hero", blocks: ["columns-media"], defaultContent: [] },
      { id: "premium-benefits", name: "Benefit cards", selector: [".started"], style: "premium-benefits", blocks: ["cards-icon"], defaultContent: [".started > .container > h2"] },
      { id: "premium-compare", name: "Premium vs Standard", selector: [".support-scaling.support-flex"], style: "premium-compare", blocks: ["columns-media"], defaultContent: [".support-scaling.support-flex h2"] },
      { id: "premium-team", name: "Meet the team", selector: [".support-team"], style: "premium-team", blocks: ["carousel-testimonial"], defaultContent: [".support-team > .container"] },
      { id: "premium-success", name: "Success story", selector: [".get-started"], style: "premium-success", blocks: ["columns-media"], defaultContent: [] },
      { id: "premium-cta", name: "Contact CTA", selector: [".contact-sales"], style: "cta", blocks: ["hero-cta"], defaultContent: [] },
      { id: "premium-table", name: "Exclusive benefits table", selector: [".support-scaling:not(.support-flex)"], style: "premium-table", blocks: ["table-compare"], defaultContent: [".support-scaling:not(.support-flex) h2"] }
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
  var import_premium_support_page_default = {
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
  return __toCommonJS(import_premium_support_page_exports);
})();
