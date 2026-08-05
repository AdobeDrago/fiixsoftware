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

  // tools/importer/import-enterprise-page.js
  var import_enterprise_page_exports = {};
  __export(import_enterprise_page_exports, {
    default: () => import_enterprise_page_default
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

  // tools/importer/parsers/accordion-faq.js
  function parse2(element, { document }) {
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

  // tools/importer/parsers/cards-icon.js
  function parse3(element, { document }) {
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
  function parse4(element, { document }) {
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

  // tools/importer/parsers/enterprise-carousel-testimonial.js
  function parse5(element, { document }) {
    const owlItems = Array.from(element.querySelectorAll(".owl-item:not(.cloned) > .item"));
    const items = owlItems.length ? owlItems : Array.from(element.querySelectorAll(":scope > .item, .item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const seen = /* @__PURE__ */ new Set();
    items.forEach((item) => {
      const paras = Array.from(item.querySelectorAll(":scope > p"));
      if (paras.length === 0) return;
      const key = paras[0].textContent.trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      const contentCell = paras.map((p) => p);
      cells.push(["", contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-testimonial", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/enterprise-cards-icon.js
  function parse6(element, { document }) {
    const cards = Array.from(element.querySelectorAll(":scope > .cont, :scope > div"));
    if (cards.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cards.forEach((card) => {
      const icon = card.querySelector("figure img, figure picture, img");
      const textWrap = card.querySelector(":scope > div") || card;
      const textCell = [];
      const heading = textWrap.querySelector("h1, h2, h3, h4");
      if (heading) textCell.push(heading);
      Array.from(textWrap.querySelectorAll(":scope > p")).forEach((p) => textCell.push(p));
      const cta = textWrap.querySelector("a[href]");
      if (cta) textCell.push(cta);
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

  // tools/importer/parsers/enterprise-columns-media.js
  function parse7(element, { document }) {
    let columns = Array.from(element.children).filter(
      (c) => c.nodeType === 1 && c.textContent.trim().length + c.querySelectorAll("img").length > 0
    );
    if (columns.length === 1 && columns[0].children.length >= 2) {
      columns = Array.from(columns[0].children).filter(
        (c) => c.nodeType === 1 && c.textContent.trim().length + c.querySelectorAll("img").length > 0
      );
    }
    element.querySelectorAll("img").forEach((img) => {
      if (!img.getAttribute("src")) {
        const lazy = img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
        if (lazy) img.setAttribute("src", lazy);
      }
    });
    if (columns.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const row = columns.map((col) => {
      const onlyImg = col.querySelector("img");
      const hasText = col.textContent.trim().length > 0;
      if (onlyImg && !hasText) return onlyImg;
      return col;
    });
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/enterprise-social-proof.js
  function parse8(element, { document }) {
    const logo = element.querySelector(".feature-selector img.active") || element.querySelector(".feature-selector img");
    const activeItem = element.querySelector(".feature-item .item.active") || element.querySelector(".feature-item .item");
    const contentCell = [];
    if (activeItem) {
      Array.from(activeItem.querySelectorAll(":scope > p")).forEach((p) => contentCell.push(p));
    }
    if (!logo && contentCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[logo || "", contentCell.length ? contentCell : ""]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells });
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

  // tools/importer/import-enterprise-page.js
  function resolveParser(blockName, selector) {
    if (blockName === "carousel-testimonial") return parse5;
    if (blockName === "cards-icon") {
      return selector.includes(".ent-flex") ? parse6 : parse3;
    }
    if (blockName === "columns-media") {
      return selector.includes("feature-container-ent") ? parse8 : parse7;
    }
    if (blockName === "columns-logos") return parse;
    if (blockName === "accordion-faq") return parse2;
    if (blockName === "hero-cta") return parse4;
    return null;
  }
  var PAGE_TEMPLATE = {
    name: "enterprise-page",
    description: "Enterprise landing page reusing existing blocks.",
    urls: ["https://fiixsoftware.com/enterprise/"],
    blocks: [
      { name: "columns-logos", instances: [".ent-header .ent-logos", ".tools .tools-logos"] },
      { name: "carousel-testimonial", instances: [".ent-header .loop.owl-carousel"] },
      { name: "cards-icon", instances: [".tools .ent-flex", ".scale .secure-logos"] },
      { name: "columns-media", instances: [".scale .organized", ".social-proof #feature-container-ent", ".operation .product-flex", ".success .success-flex"] },
      { name: "accordion-faq", instances: [".scale .faq-accordion"] },
      { name: "hero-cta", instances: [".demo"] }
    ],
    sections: [
      { id: "enterprise-hero", name: "Hero", selector: [".ent-header"], style: "enterprise-hero", blocks: ["columns-logos", "carousel-testimonial"], defaultContent: [".ent-header h1", ".ent-header .container > h2:first-of-type", ".ent-header .container > p"] },
      { id: "enterprise-tools", name: "Tools & product cards", selector: [".tools"], style: "enterprise-tools", blocks: ["columns-logos", "cards-icon"], defaultContent: [".tools .tools-logos-header", ".tools > .container > h2"] },
      { id: "enterprise-scale", name: "Scale faster", selector: [".scale"], style: "enterprise-scale", blocks: ["columns-media", "accordion-faq", "cards-icon"], defaultContent: [".scale > .container > h2", ".scale .maintenance-teams > h2", ".scale .fiix-secure"] },
      { id: "enterprise-social-proof", name: "Social proof", selector: [".social-proof"], style: "enterprise-social-proof", blocks: ["columns-media"], defaultContent: [".social-proof #feature-container-ent > .container > h2"] },
      { id: "enterprise-operation", name: "World-class operation", selector: [".operation"], style: "enterprise-operation", blocks: ["columns-media"], defaultContent: [".operation > .container > h2"] },
      { id: "enterprise-success", name: "Partner for success", selector: [".success"], style: "enterprise-success", blocks: ["columns-media"], defaultContent: [] },
      { id: "enterprise-cta", name: "Closing CTA", selector: [".demo"], style: "cta", blocks: ["hero-cta"], defaultContent: [] }
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
  var import_enterprise_page_default = {
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
  return __toCommonJS(import_enterprise_page_exports);
})();
