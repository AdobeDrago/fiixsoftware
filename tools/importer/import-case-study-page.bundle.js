/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/parsers/case-study-intro-components.js
  function parse2(element, { document }) {
    const container = element.querySelector(":scope > .container") || element;
    const output = [];
    const children = Array.from(element.children).flatMap((child) => child === container ? Array.from(container.children) : [child]);
    const createBlock = (name, cells) => WebImporter.Blocks.createBlock(document, { name, cells });
    const flushProfiles = (cells) => {
      if (cells.length) output.push(createBlock("case-study-profiles", cells));
    };
    const isLogo = (node) => node.matches("figure.large-logo");
    const isProfile = (node) => node.matches(".intro-flex");
    const isLead = (node) => node.matches("p");
    const getLogoBlockName = (logo) => {
      const sourceWidth = Number.parseFloat(logo.ownerDocument.defaultView?.getComputedStyle(logo).width);
      if (sourceWidth >= 280) return "case-study-logo (large)";
      if (sourceWidth >= 200) return "case-study-logo (wide)";
      return "case-study-logo";
    };
    const getYoutubeIframe = (node) => node.matches('iframe[src*="youtube.com"], iframe[src*="youtu.be"]') ? node : node.querySelector('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
    const createYoutubeBlock = (iframe) => {
      const link = document.createElement("a");
      const title = iframe.title.trim();
      link.href = iframe.src;
      link.textContent = iframe.src;
      return createBlock("youtube-video", [title ? [link, title] : [link]]);
    };
    for (let index = 0; index < children.length; ) {
      const child = children[index];
      if (isLogo(child)) {
        output.push(createBlock(getLogoBlockName(child), [[child]]));
        index += 1;
        continue;
      }
      if (isLead(child)) {
        const cells = [];
        while (children[index] && isLead(children[index])) {
          cells.push([children[index]]);
          index += 1;
        }
        output.push(createBlock("case-study-lead", cells));
        continue;
      }
      if (isProfile(child)) {
        const cells = [];
        while (children[index] && isProfile(children[index])) {
          const profile = children[index];
          const image = profile.querySelector(":scope > figure, :scope > picture, :scope > img");
          const details = Array.from(profile.children).find((node) => node !== image && node.textContent.trim());
          if (image && details) {
            cells.push([image, details]);
          } else {
            flushProfiles(cells);
            cells.length = 0;
            output.push(profile);
          }
          index += 1;
        }
        flushProfiles(cells);
        continue;
      }
      const iframe = getYoutubeIframe(child);
      if (iframe) {
        output.push(createYoutubeBlock(iframe));
        index += 1;
        continue;
      }
      output.push(child);
      index += 1;
    }
    element.replaceWith(...output);
  }

  // tools/importer/parsers/columns-media.js
  function parse3(element, { document }) {
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
  function parse4(element, { document }) {
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
      element.querySelectorAll("div#gallery").forEach((gallery) => {
        const imgs = [];
        const seen = /* @__PURE__ */ new Set();
        gallery.querySelectorAll("img").forEach((img) => {
          const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
          if (!src || seen.has(src)) return;
          seen.add(src);
          if (!img.getAttribute("src")) img.setAttribute("src", src);
          imgs.push(img);
        });
        if (imgs.length === 0) return;
        const frag = element.ownerDocument.createDocumentFragment();
        imgs.forEach((img) => {
          const p = element.ownerDocument.createElement("p");
          p.append(img);
          frag.append(p);
        });
        gallery.replaceWith(frag);
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
    "case-study-intro-components": parse2,
    "columns-media": parse3,
    "hero-cta": parse4
  };
  var PAGE_TEMPLATE = {
    name: "case-study-page",
    description: "Customer case study page: hero, composable company-intro blocks, challenge-solution-result columns, company overview, and a closing free-tour CTA band.",
    urls: [
      "https://fiixsoftware.com/resource-center/case-studies/universal-pure/",
      "https://fiixsoftware.com/resource-center/case-studies/dlg-group/",
      "https://fiixsoftware.com/resource-center/case-studies/farming-maintenance/",
      "https://fiixsoftware.com/resource-center/case-studies/edms-consultants/",
      "https://fiixsoftware.com/resource-center/case-studies/pro-vac-fleet/",
      "https://fiixsoftware.com/resource-center/case-studies/perth-county-ingredients/"
    ],
    // Selectors are keyed on the shared `div.case-studies-temp` wrapper rather than
    // a specific layout modifier: universal-pure/dlg-group use `.cloeren`, the older
    // farming-maintenance page uses `.jf`. `.ba-fiix` (challenge/solution/result
    // columns) is absent on farming-maintenance — that page's infographic + narrative
    // fall through to default content, which the empty-block guard handles cleanly.
    blocks: [
      { name: "hero-case-study", instances: ["div.case-studies-temp > header"] },
      { name: "case-study-intro-components", instances: ["div.case-studies-temp > .company-intro"] },
      { name: "columns-media", instances: ["div.company-intro div.ba-fiix", ".ba-fiix"] },
      { name: "hero-cta", instances: ["div.kick-the-tires"] }
    ],
    // Split the top experience into independently authorable hero, company-intro,
    // and overview sections. The intro section owns only shared layout treatment;
    // its logo, profile, copy, and YouTube blocks remain independently reusable.
    sections: [
      { id: "case-study-hero", name: "Case study hero", selector: ["div.case-studies-temp > header"], style: null, blocks: ["hero-case-study"], defaultContent: [] },
      { id: "case-study-intro", name: "Case study intro", selector: ["div.case-studies-temp > .company-intro"], style: "case-study-intro", blocks: ["case-study-logo", "case-study-profiles", "case-study-lead", "youtube-video", "columns-media"], defaultContent: [] },
      { id: "case-study-overview", name: "Case study overview", selector: ["div.case-studies-temp > .container.content"], style: null, blocks: [], defaultContent: [] },
      { id: "case-study-cta", name: "Free tour CTA", selector: ["div.kick-the-tires", ".kick-the-tires"], style: "cta", blocks: ["hero-cta"], defaultContent: [] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
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
