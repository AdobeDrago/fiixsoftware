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

  // tools/importer/import-pricing-page.js
  var import_pricing_page_exports = {};
  __export(import_pricing_page_exports, {
    default: () => import_pricing_page_default
  });

  // tools/importer/parsers/columns-logos.js
  function parse(element, { document }) {
    const images = Array.from(element.querySelectorAll("img"));
    if (images.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push(images.map((img) => img));
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-logos", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-pricing.js
  function parse2(element, { document }) {
    const cards = Array.from(element.querySelectorAll(":scope > .pricing-performance"));
    if (cards.length === 0) {
      return;
    }
    const cells = [];
    cards.forEach((card) => {
      const cellContent = [];
      const ribbon = card.querySelector(":scope > h4.ribbon");
      if (ribbon) cellContent.push(ribbon);
      const heading = card.querySelector(":scope > h2");
      if (heading) cellContent.push(heading);
      const descriptions = Array.from(card.querySelectorAll(":scope > p:not(.hide-d)"));
      descriptions.forEach((p) => cellContent.push(p));
      const group = card.querySelector(":scope > .group");
      if (group) {
        group.querySelectorAll("i").forEach((icon) => icon.remove());
        cellContent.push(group);
      }
      const priceGroup = card.querySelector(":scope > .group-btm");
      if (priceGroup) cellContent.push(priceGroup);
      const cta = card.querySelector(":scope > a.buy, :scope > a.demo");
      if (cta) {
        cta.querySelectorAll(".sr-only, i").forEach((n) => n.remove());
        cellContent.push(cta);
      }
      cells.push([cellContent]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-pricing", cells });
    const firstCard = cards[0];
    firstCard.parentNode.insertBefore(block, firstCard);
    cards.forEach((card) => card.remove());
  }

  // tools/importer/parsers/columns-callout.js
  function parse3(element, { document }) {
    const info = element.querySelector(".lite-info");
    const cta = element.querySelector("a.demo, a.track, .lite-license > a, a[href]");
    if (!info && !cta) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([info || "", cta || ""]);
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-callout", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-compare.js
  function parse4(element, { document }) {
    const PLAN_NAMES = ["Free", "Basic", "Professional", "Enterprise"];
    const COLS = PLAN_NAMES.length + 1;
    const table = element.querySelector("table");
    if (!table) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const sourceRows = Array.from(table.querySelectorAll(":scope > tbody > tr, :scope > thead > tr"));
    if (sourceRows.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const headerRow = [""];
    PLAN_NAMES.forEach((name) => {
      const strong = document.createElement("strong");
      strong.textContent = name;
      headerRow.push(strong);
    });
    cells.push(headerRow);
    const makeMarker = () => {
      const span = document.createElement("span");
      span.textContent = "\u2713";
      return span;
    };
    sourceRows.forEach((tr) => {
      const rowCells = Array.from(tr.children);
      if (rowCells.length === 1 && rowCells[0].textContent.trim() === "") return;
      if (rowCells.length === 1) {
        const label = rowCells[0].textContent.trim();
        const strong = document.createElement("strong");
        strong.textContent = label;
        const row2 = [strong];
        while (row2.length < COLS) row2.push("");
        cells.push(row2);
        return;
      }
      const row = [];
      const labelCell = rowCells[0];
      const labelText = labelCell.textContent.replace(/\s+/g, " ").trim();
      row.push(labelText || "");
      for (let i = 1; i < COLS; i += 1) {
        const planCell = rowCells[i];
        if (planCell && planCell.querySelector('i.fa-check, [class*="fa-check"]')) {
          row.push(makeMarker());
        } else {
          row.push("");
        }
      }
      while (row.length < COLS) row.push("");
      cells.push(row);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "table-compare", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-faq.js
  function parse5(element, { document }) {
    const items = Array.from(element.querySelectorAll(":scope > div"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item) => {
      const title = item.querySelector("h3, h2, h4");
      const content = Array.from(item.querySelectorAll(":scope > p"));
      if (!title && content.length === 0) return;
      cells.push([
        title || "",
        content.length ? content : ""
      ]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-faq", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-features.js
  function parse6(element, { document }) {
    const container = element.querySelector(".feature-container") || element;
    const cards = Array.from(container.querySelectorAll(":scope > div")).filter((div) => div.querySelector("h1, h2, h3, h4, p"));
    if (cards.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cards.forEach((card) => {
      const cellContent = [];
      const heading = card.querySelector("h1, h2, h3, h4");
      if (heading) cellContent.push(heading);
      const paragraphs = Array.from(card.querySelectorAll(":scope > p"));
      paragraphs.forEach((p) => cellContent.push(p));
      if (cellContent.length === 0) return;
      cells.push([cellContent]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-features", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  function parse7(element, { document }) {
    const popup = element.querySelector(".white-popup, .mfp-hide");
    let image = Array.from(element.querySelectorAll("img, picture")).find((el) => !popup || !popup.contains(el)) || null;
    if (image) {
      const img = image.tagName === "IMG" ? image : image.querySelector("img");
      if (img && !img.getAttribute("src")) {
        const lazy = img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
        if (lazy) img.setAttribute("src", lazy);
      }
    }
    const content = element.querySelector(".pricing-connectusers-content");
    const cellContent = [];
    if (content) {
      Array.from(content.children).forEach((child) => cellContent.push(child));
    }
    if (!image && cellContent.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([image || "", cellContent.length ? cellContent : ""]);
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-icon.js
  function parse8(element, { document }) {
    const items = Array.from(element.querySelectorAll("dl"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((dl) => {
      const icon = dl.querySelector("dt img, dt picture, img");
      const defs = Array.from(dl.querySelectorAll("dd"));
      const textCell = [];
      if (defs.length > 0) {
        const title = document.createElement("h3");
        title.innerHTML = defs[0].innerHTML;
        textCell.push(title);
        defs.slice(1).forEach((dd) => {
          const p = document.createElement("p");
          p.innerHTML = dd.innerHTML;
          textCell.push(p);
        });
      }
      if (!icon && textCell.length === 0) return;
      cells.push([icon || "", textCell.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-icon", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-cta.js
  function parse9(element, { document }) {
    const inner = element.querySelector(".container > div") || element;
    const image = inner.querySelector("figure img, img, picture");
    const heading = inner.querySelector("h1, h2, h3");
    const description = inner.querySelector("p");
    const cta = inner.querySelector("a[href]");
    if (!heading && !description && !cta) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) cells.push([image]);
    const contentCell = [];
    if (heading) contentCell.push(heading);
    if (description) contentCell.push(description);
    if (cta) contentCell.push(cta);
    cells.push([contentCell]);
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
        "#back-to-top"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.siteHeader",
        "#mobile-header",
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

  // tools/importer/import-pricing-page.js
  var parsers = {
    "columns-logos": parse,
    "cards-pricing": parse2,
    "columns-callout": parse3,
    "table-compare": parse4,
    "accordion-faq": parse5,
    "cards-features": parse6,
    "columns-media": parse7,
    "cards-icon": parse8,
    "hero-cta": parse9
  };
  var PAGE_TEMPLATE = {
    name: "pricing-page",
    description: "CMMS plans and pricing page with header/navigation, pricing plans, feature comparison table, FAQ accordion, additional content sections, and footer",
    urls: [
      "https://fiixsoftware.com/cmms/pricing/"
    ],
    blocks: [
      { name: "columns-logos", instances: [".pricing_header .awards", ".fiix-users"] },
      { name: "cards-pricing", instances: [".pricing-plans-t .pricing-breakdown"] },
      { name: "columns-callout", instances: [".lite_license"] },
      { name: "table-compare", instances: ["#compare .feature-table-t"] },
      { name: "accordion-faq", instances: [".faq-accordion"] },
      { name: "cards-features", instances: [".pricing-topfeatures"] },
      { name: "columns-media", instances: [".pricing-connectusers"] },
      { name: "cards-icon", instances: [".succeed-container"] },
      { name: "hero-cta", instances: [".pricing-kickthetires"] }
    ],
    sections: [
      { id: "pricing-header", name: "Pricing header", selector: ["#pricing"], style: "pricing-hero", blocks: ["columns-logos", "cards-pricing", "columns-callout"], defaultContent: [".pricing_header .headerbox"] },
      { id: "compare", name: "Feature comparison", selector: ["#compare"], style: "feature-compare", blocks: ["table-compare"], defaultContent: [] },
      { id: "customer-logos", name: "Customer logos", selector: ["#page-wrap .new-product .fiix-users", ".fiix-users"], style: "logos", blocks: ["columns-logos"], defaultContent: [".fiixUserTeams-sect h2"] },
      { id: "faq", name: "FAQ", selector: ["#page-wrap .pricing-faq", ".pricing-faq"], style: "faq", blocks: ["accordion-faq"], defaultContent: [".pricing-faq .container > h2", ".pricing-faq .more-info"] },
      { id: "top-features", name: "Top features", selector: ["#page-wrap .pricing-topfeatures", ".pricing-topfeatures"], style: "features", blocks: ["cards-features"], defaultContent: [] },
      { id: "connect-users", name: "Connect users", selector: ["#page-wrap .pricing-connectusers", ".pricing-connectusers"], style: "connect-users", blocks: ["columns-media"], defaultContent: [] },
      { id: "customer-success", name: "Customer success", selector: ["#page-wrap .succeed-container", ".succeed-container"], style: "customer-success", blocks: ["cards-icon"], defaultContent: [".succeed-container > h2"] },
      { id: "find-plan-cta", name: "Find the plan CTA", selector: ["#page-wrap .pricing-kickthetires", ".pricing-kickthetires"], style: "cta", blocks: ["hero-cta"], defaultContent: [] }
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
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_pricing_page_default = {
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
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
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
  return __toCommonJS(import_pricing_page_exports);
})();
