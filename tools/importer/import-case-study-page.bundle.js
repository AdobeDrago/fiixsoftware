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

  // tools/importer/import-case-study-page.js
  var import_case_study_page_exports = {};
  __export(import_case_study_page_exports, {
    default: () => import_case_study_page_default
  });

  // tools/importer/parsers/hero-case-study.js
  function parse(element, { document }) {
    const image = element.querySelector(":scope > img, img, picture");
    const inner = element.querySelector(":scope > div") || element;
    const title = inner.querySelector("h1, h2, h3");
    const subheading = inner.querySelector("h1 ~ h2, h2 ~ h3");
    const cta = inner.querySelector("a[href]");
    if (cta) cta.querySelectorAll(".sr-only").forEach((s) => s.remove());
    if (!title && !subheading && !cta && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) cells.push([image]);
    const contentCell = [];
    if (title) contentCell.push(title);
    if (subheading && subheading !== title) contentCell.push(subheading);
    if (cta) {
      const ctaWrap = cta.closest("p");
      contentCell.push(ctaWrap && inner.contains(ctaWrap) ? ctaWrap : cta);
    }
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-case-study", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  function parse2(element, { document }) {
    const normalizeLazy = (root) => root.querySelectorAll("img").forEach((img) => {
      if (!img.getAttribute("src")) {
        const lazy = img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
        if (lazy) img.setAttribute("src", lazy);
      }
    });
    const preserveBefore = (node) => {
      if (node && node.parentNode) element.parentNode.insertBefore(node, element);
    };
    const cleanLink = (a) => {
      if (a) a.querySelectorAll(".sr-only").forEach((s) => s.remove());
      return a;
    };
    if (element.matches(".ba-fiix")) {
      const cols = Array.from(element.querySelectorAll(":scope > div"));
      const row = cols.map((col) => {
        col.querySelectorAll('i[class*="fa-"]').forEach((i) => i.remove());
        col.querySelectorAll(".sr-only").forEach((s) => s.remove());
        const cell = [];
        const h = col.querySelector(":scope > h3, :scope > h2, :scope > h4");
        if (h) cell.push(h);
        col.querySelectorAll(":scope > .list-item > ul, :scope > .list-item > ol, :scope > ul, :scope > ol, :scope > p").forEach((n) => cell.push(n));
        return cell.length ? cell : "";
      }).filter((c) => c !== "");
      if (row.length === 0) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const cells2 = [row];
      const block2 = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells: cells2 });
      element.replaceWith(block2);
      return;
    }
    const headerInfo = element.matches("header.container") || element.querySelector(":scope > .header-info") ? element.querySelector(":scope > .header-info") : null;
    if (headerInfo) {
      normalizeLazy(element);
      const artFig = element.querySelector(":scope > figure.header-img, :scope > figure");
      const art = artFig ? artFig.querySelector("picture, img") || artFig : null;
      const textCell = [];
      Array.from(headerInfo.children).forEach((c) => {
        if (c.tagName === "A") cleanLink(c);
        textCell.push(c);
      });
      if (!art && textCell.length === 0) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const cells2 = [[textCell.length ? textCell : "", art || ""]];
      const block2 = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells: cells2 });
      element.replaceWith(block2);
      return;
    }
    const questions = Array.from(element.querySelectorAll(":scope > .container > .question, :scope .question"));
    if (element.matches("section.fiixMAX-info") || questions.length) {
      normalizeLazy(element);
      const container = element.querySelector(":scope > .container") || element;
      const heading = container.querySelector(":scope > h2");
      const logoFig = container.querySelector(":scope > figure");
      const heroVid = container.querySelector(":scope > .vid-cont");
      const ctaWrap = container.querySelector(":scope > .text-center");
      const quote = container.querySelector(":scope > .quote");
      [logoFig, heading, heroVid, ctaWrap, quote].forEach(preserveBefore);
      const cells2 = [];
      questions.forEach((q) => {
        const qText = q.querySelector(":scope > .q-text") || q;
        const qVid = q.querySelector(":scope > .q-vid");
        let media = qVid ? qVid.querySelector('img[class*="embed"], img') || qVid.querySelector("picture") : null;
        const copyCell = [];
        Array.from(qText.children).forEach((c) => copyCell.push(c));
        if (!media && copyCell.length === 0) return;
        cells2.push([media || "", copyCell.length ? copyCell : ""]);
      });
      if (cells2.length === 0) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells: cells2 });
      element.replaceWith(block2);
      return;
    }
    const flex = element.querySelector(
      ":scope > .container > .info-flex, :scope > .container > .flex, :scope > .info-flex, :scope > .flex, :scope > .container > .two-col, :scope > .together-flex"
    );
    const isMarketing2Col = element.matches("section.augury, section.what-is-it, section.case-study, section.together") || flex;
    if (isMarketing2Col && flex) {
      normalizeLazy(element);
      const container = element.querySelector(":scope > .container") || element;
      Array.from(container.children).forEach((c) => {
        if (c === flex) return;
        if (/^(H1|H2|H3)$/.test(c.tagName) || c.tagName === "P" && !c.querySelector("img")) preserveBefore(c);
      });
      const cols = Array.from(flex.children).filter(
        (c) => c.nodeType === 1 && (c.textContent.trim().length > 0 || c.querySelector("img"))
      );
      const row = cols.map((col) => {
        col.querySelectorAll("a .sr-only").forEach((s) => s.remove());
        const onlyImg = col.querySelector("picture, img");
        const hasText = col.textContent.trim().length > 0;
        if (onlyImg && !hasText) return onlyImg;
        return col;
      });
      if (row.length === 0) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const cells2 = [row];
      const block2 = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells: cells2 });
      element.replaceWith(block2);
      return;
    }
    const introImage = element.querySelector(":scope > .intro-image, .intro-image");
    const introBlock = element.querySelector(":scope > .container > .intro-block, .intro-block");
    if (introImage || introBlock) {
      let mediaImg = null;
      if (introImage) {
        mediaImg = introImage.querySelector("figure.screen img, figure.screen2 img, figure.screen picture, figure.screen2 picture") || Array.from(introImage.querySelectorAll("img")).find((im) => {
          const fig = im.closest("figure");
          return !fig || !/\bshape\b|\bshape2\b/.test(fig.className);
        }) || introImage.querySelector("img, picture");
      }
      if (mediaImg && mediaImg.tagName !== "IMG") mediaImg = mediaImg.querySelector("img") || mediaImg;
      if (mediaImg && mediaImg.tagName === "IMG" && !mediaImg.getAttribute("src")) {
        const lazy = mediaImg.getAttribute("data-src") || mediaImg.getAttribute("data-lazy-src");
        if (lazy) mediaImg.setAttribute("src", lazy);
      }
      const textCell = [];
      if (introBlock) {
        Array.from(introBlock.children).forEach((child) => textCell.push(child));
      }
      if (!mediaImg && textCell.length === 0) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const pfCells = [[mediaImg || "", textCell.length ? textCell : ""]];
      const pfBlock = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells: pfCells });
      element.replaceWith(pfBlock);
      return;
    }
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

  // tools/importer/parsers/hero-cta.js
  function parse3(element, { document }) {
    const inner = element.querySelector(".container > div") || element;
    const image = inner.querySelector("figure img, img, picture");
    const heading = inner.querySelector("h1, h2, h3");
    const description = inner.querySelector("p");
    const cta = inner.querySelector("a[href]");
    if (cta) cta.querySelectorAll(".sr-only").forEach((sr) => sr.remove());
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
        "#back-to-top",
        // Contact-us page: the interactive Google Map widget is not authorable
        // and its tile <img>s would otherwise leak into the import. Remove only
        // the map div (#contactmap.google_map) — NOT the .contact_map column,
        // which also contains the .contact-location office info. The office
        // parser renders a static "View on Google Maps" link in its place.
        "#contactmap",
        ".google_map"
      ]);
      element.querySelectorAll("div.vidyardVid").forEach((vid) => {
        const iframe = vid.querySelector('iframe[src*="play.vidyard.com"]');
        if (!iframe) return;
        const src = iframe.getAttribute("src");
        const url = src.split("?")[0];
        const p = element.ownerDocument.createElement("p");
        const a = element.ownerDocument.createElement("a");
        a.href = url;
        a.textContent = url;
        p.append(a);
        vid.replaceWith(p);
      });
      element.querySelectorAll("q").forEach((q) => {
        q.replaceWith(element.ownerDocument.createTextNode(q.textContent));
      });
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

  // tools/importer/import-case-study-page.js
  var parsers = {
    "hero-case-study": parse,
    "columns-media": parse2,
    "hero-cta": parse3
  };
  var PAGE_TEMPLATE = {
    name: "case-study-page",
    description: "Customer case study page: hero (customer name + headline), customer intro with logo/headshot/quote and challenge-solution-result columns, company overview narrative with embedded video, and a closing free-tour CTA band.",
    urls: ["https://fiixsoftware.com/resource-center/case-studies/universal-pure/"],
    blocks: [
      { name: "hero-case-study", instances: ["div.case-studies-temp.cloeren > header"] },
      { name: "columns-media", instances: ["div.company-intro div.ba-fiix", ".ba-fiix"] },
      { name: "hero-cta", instances: ["div.kick-the-tires"] }
    ],
    // The closing "kick the tires" CTA is split into its own section carrying the
    // shared `cta` section style (soft cyan→white gradient + centered layout),
    // matching the pricing/premium/enterprise CTA bands. Everything above the CTA
    // stays in the first (unstyled) section. Two sections → the section transformer
    // emits one <hr> break before the CTA plus its Section Metadata block.
    sections: [
      { id: "case-study-body", name: "Case study body", selector: ["div.case-studies-temp.cloeren > header"], style: null, blocks: ["hero-case-study", "columns-media"], defaultContent: [] },
      { id: "case-study-cta", name: "Free tour CTA", selector: ["div.kick-the-tires", ".kick-the-tires"], style: "cta", blocks: ["hero-cta"], defaultContent: [] }
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
  var import_case_study_page_default = {
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
          console.warn(`No parser found for block: ${block.name} (${block.selector})`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
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
  return __toCommonJS(import_case_study_page_exports);
})();
