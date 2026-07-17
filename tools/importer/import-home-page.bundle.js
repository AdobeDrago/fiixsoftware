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

  // tools/importer/import-home-page.js
  var import_home_page_exports = {};
  __export(import_home_page_exports, {
    default: () => import_home_page_default
  });

  // tools/importer/parsers/hero-lead.js
  function parse(element, { document }) {
    const headerFlex = element.querySelector(".header-flex") || element;
    const h1 = headerFlex.querySelector("h1");
    const h2 = headerFlex.querySelector("h2");
    const emailForm = element.querySelector("#freetour_email, .twoStep-form form, .twoStep-form");
    const ctaLink = element.querySelector("a.mobile-cta[href], a.darkBlue-cta[href], a.track[href]");
    const statsIntro = element.querySelector("p.average");
    const statsSection = element.querySelector("section.using-fiix");
    const heroImage = element.querySelector("figure.hero-feature-image img, figure.hero-feature-image picture, .hero-feature-image img");
    if (!h1 && !h2 && !heroImage) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (heroImage)
      cells.push([heroImage]);
    const contentCell = [];
    if (h1)
      contentCell.push(h1);
    if (h2)
      contentCell.push(h2);
    if (emailForm)
      contentCell.push(emailForm);
    if (ctaLink)
      contentCell.push(ctaLink);
    if (statsIntro)
      contentCell.push(statsIntro);
    if (statsSection)
      contentCell.push(statsSection);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-lead", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-logos.js
  function parse2(element, { document }) {
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

  // tools/importer/parsers/tabs-feature.js
  function parse3(element, { document }) {
    const panelsRoot = element.querySelector(".feature-item, #forecaster-desc") || element.querySelector("section, #forecaster");
    const items = panelsRoot ? Array.from(panelsRoot.querySelectorAll(":scope > .item")) : Array.from(element.querySelectorAll(".item"));
    const figure = element.querySelector("figure");
    const media = figure ? Array.from(figure.querySelectorAll(":scope > video, :scope > img, :scope > picture")) : [];
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item, i) => {
      const h3 = item.querySelector("h3");
      let labelCell;
      if (h3) {
        const label = document.createElement("p");
        const link = h3.querySelector("a");
        label.textContent = (link ? link.textContent : h3.textContent).trim().replace(/\s+/g, " ");
        labelCell = label;
      } else {
        labelCell = `Tab ${i + 1}`;
      }
      const panelCell = [];
      Array.from(item.children).forEach((child) => {
        if (child === h3)
          return;
        panelCell.push(child);
      });
      const mediaEl = media[i];
      if (mediaEl) {
        if (mediaEl.tagName === "VIDEO") {
          const src = mediaEl.querySelector("source");
          const url = src ? src.getAttribute("src") : mediaEl.getAttribute("src");
          if (url) {
            const a = document.createElement("a");
            a.href = url;
            a.textContent = url;
            panelCell.push(a);
          }
        } else {
          panelCell.push(mediaEl);
        }
      }
      cells.push([labelCell, panelCell.length ? panelCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-video.js
  function parse4(element, { document }) {
    const items = Array.from(element.querySelectorAll(".item-cont > .item, .item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item) => {
      const thumb = item.querySelector(":scope > img, :scope > picture") || item.querySelector("img, picture");
      const bodyCell = [];
      Array.from(item.querySelectorAll(":scope > p")).forEach((p) => bodyCell.push(p));
      if (!thumb && bodyCell.length === 0)
        return;
      cells.push([thumb || "", bodyCell.length ? bodyCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-icon.js
  function parse5(element, { document }) {
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
      if (!icon && textCell.length === 0)
        return;
      cells.push([icon || "", textCell.length ? textCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-icon", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-testimonial.js
  function parse6(element, { document }) {
    const owlItems = Array.from(element.querySelectorAll(".owl-item:not(.cloned) > .item"));
    const items = owlItems.length ? owlItems : Array.from(element.querySelectorAll(".mh-slider .item, .item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const seen = /* @__PURE__ */ new Set();
    items.forEach((item) => {
      const h3 = item.querySelector("h3");
      const key = (h3 ? h3.textContent : item.textContent).trim();
      if (!key || seen.has(key))
        return;
      seen.add(key);
      const headshot = item.querySelector(".headshot img, .headshot picture");
      const contentCell = [];
      if (h3)
        contentCell.push(h3);
      Array.from(item.querySelectorAll(":scope > p")).forEach((p) => contentCell.push(p));
      const authorInfo = item.querySelector(".person_feature > div");
      if (authorInfo) {
        Array.from(authorInfo.querySelectorAll("p")).forEach((p) => contentCell.push(p));
      }
      const companyLogo = item.querySelector(".company_logo img, .company_logo picture");
      if (companyLogo)
        contentCell.push(companyLogo);
      if (!headshot && contentCell.length === 0)
        return;
      cells.push([
        headshot || "",
        contentCell.length ? contentCell : ""
      ]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-testimonial", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-cta.js
  function parse7(element, { document }) {
    const flex = element.querySelector(".ai-flex") || element.querySelector(".container") || element;
    const panels = [...flex.children].filter((c) => c.querySelector("h3, h2, a[href]"));
    if (panels.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    panels.forEach((panel) => {
      const figureImg = panel.querySelector("figure img, figure picture, img");
      const body = document.createElement("div");
      panel.querySelectorAll(":scope > h2, :scope > h3, :scope > h4, :scope > p, :scope > a[href]").forEach((node) => {
        body.append(node);
      });
      body.querySelectorAll("a .sr-only").forEach((sr) => sr.remove());
      cells.push([figureImg || "", body]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-cta", cells });
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
    if (!Array.isArray(selectors))
      return null;
    for (const selector of selectors) {
      if (!selector)
        continue;
      const match = element.querySelector(selector);
      if (match)
        return match;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.beforeTransform)
      return;
    const template = payload && payload.template;
    const sections = template && template.sections;
    if (!Array.isArray(sections) || sections.length < 2)
      return;
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

  // tools/importer/import-home-page.js
  var parsers = {
    "hero-lead": parse,
    "columns-logos": parse2,
    "tabs-feature": parse3,
    "cards-video": parse4,
    "cards-icon": parse5,
    "carousel-testimonial": parse6,
    "cards-cta": parse7
  };
  var PAGE_TEMPLATE = {
    name: "home-page",
    description: "Fiix home page: lead hero with email form + stats, customer logo strip, feature tabs, video cards, security icons, insights tabs, testimonial carousel, and dual CTA panels. Header and footer are shared fragments.",
    urls: [
      "https://fiixsoftware.com/"
    ],
    blocks: [
      { name: "hero-lead", instances: [".home_header"] },
      { name: "columns-logos", instances: [".proof"] },
      { name: "tabs-feature", instances: ["#feature-container", ".parts-forecaster"] },
      { name: "cards-video", instances: [".seehow"] },
      { name: "cards-icon", instances: ["#security"] },
      { name: "carousel-testimonial", instances: [".beingused"] },
      { name: "cards-cta", instances: [".coming-to-fiix.bottom-cta-double"] }
    ],
    sections: [
      { id: "hero", name: "Hero", selector: [".home_header"], style: "home-hero", blocks: ["hero-lead"], defaultContent: [] },
      { id: "logo-strip", name: "Customer logos", selector: [".proof"], style: "logos", blocks: ["columns-logos"], defaultContent: [".proof h2"] },
      { id: "feature-tabs", name: "Feature tabs", selector: ["#feature-container"], style: "feature-tabs", blocks: ["tabs-feature"], defaultContent: ["#feature-container h2"] },
      { id: "video-cards", name: "Video cards", selector: [".seehow"], style: "video-cards", blocks: ["cards-video"], defaultContent: [".seehow h2"] },
      { id: "security-icons", name: "Security", selector: ["#security"], style: "security", blocks: ["cards-icon"], defaultContent: ["#security h2", "#security > p"] },
      { id: "insights-tabs", name: "Insights tabs", selector: [".parts-forecaster"], style: "insights-tabs", blocks: ["tabs-feature"], defaultContent: [".parts-forecaster h2", ".parts-forecaster > p"] },
      { id: "testimonial-carousel", name: "Testimonial carousel", selector: [".beingused"], style: "testimonials", blocks: ["carousel-testimonial"], defaultContent: [".beingused h2"] },
      { id: "dual-cta", name: "Dual CTA", selector: [".coming-to-fiix.bottom-cta-double"], style: "dual-cta", blocks: ["cards-cta"], defaultContent: [] }
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
          if (seen.has(element))
            return;
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
  var import_home_page_default = {
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
        if (!block.element.parentNode)
          return;
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
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath || "/index");
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
  return __toCommonJS(import_home_page_exports);
})();
