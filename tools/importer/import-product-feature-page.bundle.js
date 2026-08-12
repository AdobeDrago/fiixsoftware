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

  // tools/importer/import-product-feature-page.js
  var import_product_feature_page_exports = {};
  __export(import_product_feature_page_exports, {
    default: () => import_product_feature_page_default
  });

  // tools/importer/parsers/accordion-faq.js
  function parse(element, { document }) {
    const preserveBefore = (node) => {
      if (node && node.parentNode) element.parentNode.insertBefore(node, element);
    };
    const accordion = element.matches(".faq-accordion") ? element : element.querySelector(".faq-accordion");
    if (accordion && accordion !== element) {
      const heading = element.querySelector(":scope > h2, :scope > h3, :scope > h1");
      if (heading) preserveBefore(heading);
      const ctaWrap = element.querySelector(":scope .industry_solutions_ > .text-center, :scope > .text-center");
      if (ctaWrap && !accordion.contains(ctaWrap)) preserveBefore(ctaWrap);
    }
    const root = accordion || element;
    let items = Array.from(root.querySelectorAll(":scope > div"));
    if (items.length === 0) items = Array.from(root.querySelectorAll(".open, .closed"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item) => {
      const title = item.querySelector("h1, h2, h3, h4");
      const content = Array.from(item.children).filter((c) => c !== title);
      if (!title && content.length === 0) return;
      cells.push([
        title || "",
        content.length ? content : ""
      ]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion-faq", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-cta.js
  function parse2(element, { document }) {
    const ctaBox = element.querySelector(".CTAbox-flex");
    const articles = ctaBox ? Array.from(ctaBox.querySelectorAll(":scope > article")) : [];
    if (element.matches("section.dualCTA-box") || articles.length) {
      const cells2 = [];
      articles.forEach((article) => {
        const body = [];
        Array.from(article.children).forEach((child) => {
          if (child.tagName === "A") child.querySelectorAll(".sr-only").forEach((s) => s.remove());
          body.push(child);
        });
        if (body.length === 0) return;
        cells2.push([body]);
      });
      if (cells2.length === 0) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document, { name: "cards-cta", cells: cells2 });
      element.replaceWith(block2);
      return;
    }
    const breakdown = element.querySelector(".pricing-breakdown");
    const resourceCards = breakdown ? Array.from(breakdown.querySelectorAll(":scope > .pricing-performance")) : [];
    if (resourceCards.length) {
      const cells2 = [];
      resourceCards.forEach((card) => {
        const icon = card.querySelector(".product-icon img, .product-icon picture, figure img, img");
        const body = document.createElement("div");
        card.querySelectorAll(":scope > span > h1, :scope > span > h2, :scope > span > h3, :scope > span > h4, :scope > span > p, :scope > h2, :scope > h3, :scope > h4, :scope > p:not(.product-icon)").forEach((node) => body.append(node));
        const cta = card.querySelector("a[href]");
        if (cta) {
          cta.querySelectorAll(".sr-only").forEach((sr) => sr.remove());
          body.append(cta);
        }
        if (!icon && body.childNodes.length === 0) return;
        cells2.push([icon || "", body.childNodes.length ? body : ""]);
      });
      if (cells2.length === 0) return;
      const block2 = WebImporter.Blocks.createBlock(document, { name: "cards-cta", cells: cells2 });
      breakdown.replaceWith(block2);
      return;
    }
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

  // tools/importer/parsers/cards-features.js
  function parse3(element, { document }) {
    const productFlex = element.querySelector(".product-flex");
    if (productFlex) {
      const cards2 = Array.from(productFlex.querySelectorAll(".flex-group > div")).filter((div) => div.querySelector("h1, h2, h3, h4"));
      if (cards2.length === 0) return;
      const cells2 = [];
      cards2.forEach((card) => {
        const cellContent = [];
        const heading = card.querySelector("h1, h2, h3, h4");
        if (heading) cellContent.push(heading);
        Array.from(card.querySelectorAll(":scope > p")).forEach((p) => cellContent.push(p));
        const cardCta = card.querySelector(":scope > a[href]");
        if (cardCta) cellContent.push(cardCta);
        if (cellContent.length === 0) return;
        cells2.push([cellContent]);
      });
      if (cells2.length === 0) return;
      const strayLinks = Array.from(productFlex.querySelectorAll(".flex-link"));
      const block2 = WebImporter.Blocks.createBlock(document, { name: "cards-features", cells: cells2 });
      productFlex.replaceWith(block2);
      strayLinks.forEach((link) => {
        if (block2.nextSibling) block2.parentNode.insertBefore(link, block2.nextSibling);
        else block2.parentNode.appendChild(link);
      });
      return;
    }
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

  // tools/importer/parsers/cards-video.js
  function parse4(element, { document }) {
    const owlItems = Array.from(element.querySelectorAll(".owl-item:not(.cloned) > .item"));
    const items = owlItems.length ? owlItems : Array.from(element.querySelectorAll(".item-cont > .item, .item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const seen = /* @__PURE__ */ new Set();
    items.forEach((item) => {
      const thumb = item.querySelector(":scope > img, :scope > picture") || item.querySelector("img:not(.vidyard-lightbox-image), picture");
      const bodyCell = [];
      Array.from(item.querySelectorAll(":scope > p")).forEach((p) => bodyCell.push(p));
      const moreLink = item.querySelector(":scope > a[href]");
      if (moreLink) bodyCell.push(moreLink);
      if (!thumb && bodyCell.length === 0) return;
      const key = (bodyCell.map((n) => n.textContent).join(" ") || thumb && thumb.getAttribute("src") || "").replace(/\s+/g, " ").trim();
      if (key && seen.has(key)) return;
      if (key) seen.add(key);
      cells.push([thumb || "", bodyCell.length ? bodyCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-testimonial.js
  function parse5(element, { document }) {
    const ratingGrid = element.querySelector(":scope > .container > .flex, .flex");
    const ratingCards = ratingGrid ? Array.from(ratingGrid.querySelectorAll(":scope > div")).filter((div) => div.querySelector("p")) : [];
    if (element.matches(".social-proof-ratings") && ratingCards.length) {
      const cells2 = [];
      const seen2 = /* @__PURE__ */ new Set();
      ratingCards.forEach((card) => {
        const paras = Array.from(card.querySelectorAll(":scope > p"));
        if (paras.length === 0) return;
        const key = paras[0].textContent.trim();
        if (!key || seen2.has(key)) return;
        seen2.add(key);
        const contentCell = [];
        const ratingText = card.querySelector(".sr-only");
        if (ratingText && ratingText.textContent.trim()) {
          const rp = document.createElement("p");
          rp.textContent = ratingText.textContent.trim();
          contentCell.push(rp);
        }
        paras.forEach((p) => contentCell.push(p));
        cells2.push(["", contentCell]);
      });
      if (cells2.length === 0) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document, { name: "carousel-testimonial", cells: cells2 });
      ratingGrid.replaceWith(block2);
      return;
    }
    const csItems = Array.from(element.querySelectorAll(".feature-item .item, #cs-items .item"));
    if ((element.matches("#cs-items") || element.querySelector("#cs-items, .feature-item")) && csItems.length) {
      const cells2 = [];
      const seen2 = /* @__PURE__ */ new Set();
      csItems.forEach((item) => {
        const title = item.querySelector("p.title");
        const key = (title ? title.textContent : item.textContent).trim();
        if (!key || seen2.has(key)) return;
        seen2.add(key);
        const logo = item.querySelector("figure.mobile img, figure.mobile picture, figure img");
        const contentCell = [];
        Array.from(item.querySelectorAll(":scope > p")).forEach((p) => contentCell.push(p));
        if (!logo && contentCell.length === 0) return;
        cells2.push([logo || "", contentCell.length ? contentCell : ""]);
      });
      if (cells2.length === 0) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document, { name: "carousel-testimonial", cells: cells2 });
      element.replaceWith(block2);
      return;
    }
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
      if (!key || seen.has(key)) return;
      seen.add(key);
      const headshot = item.querySelector(".headshot img, .headshot picture");
      const contentCell = [];
      if (h3) contentCell.push(h3);
      Array.from(item.querySelectorAll(":scope > p")).forEach((p) => contentCell.push(p));
      const authorInfo = item.querySelector(".person_feature > div");
      if (authorInfo) {
        Array.from(authorInfo.querySelectorAll("p")).forEach((p) => contentCell.push(p));
      }
      const companyLogo = item.querySelector(".company_logo img, .company_logo picture");
      if (companyLogo) contentCell.push(companyLogo);
      if (!headshot && contentCell.length === 0) return;
      cells.push([
        headshot || "",
        contentCell.length ? contentCell : ""
      ]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-testimonial", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-callout.js
  function parse6(element, { document }) {
    const cta = element.querySelector("a.demo, a.track, .lite-license > a, a[href]");
    let info = element.querySelector(".lite-info");
    if (!info) {
      const textCell = [];
      Array.from(element.querySelectorAll(":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > p")).forEach((node) => {
        if (cta && node.contains(cta)) return;
        textCell.push(node);
      });
      info = textCell.length ? textCell : null;
    }
    if (!info && !cta) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([info || "", cta || ""]);
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-callout", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-logos.js
  function parse7(element, { document }) {
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

  // tools/importer/parsers/columns-media.js
  function parse8(element, { document }) {
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

  // tools/importer/parsers/hero-lead.js
  function parse9(element, { document }) {
    const copyRoot = element.querySelector(".header-flex, #homepage") || element;
    const h1 = copyRoot.querySelector("h1") || element.querySelector("h1");
    const h2 = copyRoot.querySelector("h2") || element.querySelector("h2");
    const introP = element.querySelector("#homepage > p, .header-flex > p, .header-copy > p");
    const emailForm = element.querySelector("#freetour_email, .twoStep-form form, .twoStep-form");
    const ctaLink = element.querySelector("a.mobile-cta[href], a.darkBlue-cta[href], a.track[href]");
    const reviewLine = element.querySelector(".sp-hero");
    const statsIntro = element.querySelector("p.average");
    const statsSection = element.querySelector("section.using-fiix");
    const heroImage = element.querySelector(
      "figure.header-static img, figure.header-static picture, .header-static img, figure.hero-feature-image img, figure.hero-feature-image picture, .hero-feature-image img"
    );
    if (!h1 && !h2 && !heroImage) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (heroImage) cells.push([heroImage]);
    const contentCell = [];
    if (h1) contentCell.push(h1);
    if (h2) contentCell.push(h2);
    if (introP) contentCell.push(introP);
    if (emailForm) contentCell.push(emailForm);
    if (ctaLink) contentCell.push(ctaLink);
    if (reviewLine) contentCell.push(reviewLine);
    if (statsIntro) contentCell.push(statsIntro);
    if (statsSection) contentCell.push(statsSection);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-lead", cells });
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

  // tools/importer/import-product-feature-page.js
  var parsers = {
    "accordion-faq": parse,
    "cards-cta": parse2,
    "cards-features": parse3,
    "cards-video": parse4,
    "carousel-testimonial": parse5,
    "columns-callout": parse6,
    "columns-logos": parse7,
    "columns-media": parse8,
    "hero-lead": parse9
  };
  var PAGE_TEMPLATE = {
    "name": "product-feature-page",
    "description": "Classic Fiix product/feature page (WordPress #cmms-product / #page-wrap shell): hero with email capture + review-logo strip, customer logo band, alternating 2-3 column feature sections with supporting imagery, testimonial cards, case-study carousel, 'Explore our full maintenance solution' features explorer/accordion, resource-card trio, optional FAQ accordion, final CTA band.",
    "urls": [
      "https://fiixsoftware.com/cmms/cmms-software/",
      "https://fiixsoftware.com/cmms/mobile-cmms/",
      "https://fiixsoftware.com/cmms/asset-management-software/",
      "https://fiixsoftware.com/cmms/parts-inventory-management-software/"
    ],
    "blocks": [
      {
        "name": "hero-lead",
        "instances": [
          ".header"
        ]
      },
      {
        "name": "columns-logos",
        "instances": [
          ".fiix-users",
          ".section6 .social-badges"
        ]
      },
      {
        "name": "cards-features",
        "instances": [
          ".section1",
          ".section3:not(.section3last):not(.section3r)",
          ".section5:not(.section5r):not(.section5last)",
          ".section3r",
          ".section5r",
          ".section3.section3last"
        ]
      },
      {
        "name": "cards-video",
        "instances": [
          ".video-demo"
        ]
      },
      {
        "name": "columns-media",
        "instances": [
          ".section2:not(.section2last)",
          ".section4:not(.section4r)",
          "#analyze-audits",
          ".section4r",
          ".section2.section2last"
        ]
      },
      {
        "name": "carousel-testimonial",
        "instances": [
          ".social-proof-ratings",
          ".section6 #features-ent"
        ]
      },
      {
        "name": "columns-callout",
        "instances": [
          ".section5r .cta-full, .section5r .stats"
        ]
      },
      {
        "name": "accordion-faq",
        "instances": [
          ".section6 .faq-accordion"
        ]
      },
      {
        "name": "cards-cta",
        "instances": [
          ".section7"
        ]
      }
    ],
    "sections": [
      {
        "id": "pf-hero",
        "name": "Hero",
        "selector": [
          ".header"
        ],
        "style": "pf-hero",
        "blocks": [
          "hero-lead",
          "columns-logos"
        ],
        "defaultContent": []
      },
      {
        "id": "pf-logos",
        "name": "Customer logo band",
        "selector": [
          ".fiix-users"
        ],
        "style": "pf-logos",
        "blocks": [
          "columns-logos"
        ],
        "defaultContent": [
          ".fiix-users h2"
        ]
      },
      {
        "id": "pf-workorders-features",
        "name": "Work order feature blurbs",
        "selector": [
          ".section1"
        ],
        "style": "pf-features",
        "blocks": [
          "cards-features"
        ],
        "defaultContent": [
          ".section1 > .container > h2",
          ".section1 > .container > p"
        ]
      },
      {
        "id": "pf-video-demos",
        "name": "Two-minute demos",
        "selector": [
          ".video-demo"
        ],
        "style": "pf-video",
        "blocks": [
          "cards-video"
        ],
        "defaultContent": [
          ".video-demo h2"
        ]
      },
      {
        "id": "pf-asset-track-media",
        "name": "Track/optimize asset (image+text)",
        "selector": [
          ".section2:not(.section2last)"
        ],
        "style": "pf-media-left",
        "blocks": [
          "columns-media"
        ],
        "defaultContent": []
      },
      {
        "id": "pf-asset-features",
        "name": "Asset feature grid",
        "selector": [
          ".section3:not(.section3last):not(.section3r)"
        ],
        "style": "pf-features",
        "blocks": [
          "cards-features"
        ],
        "defaultContent": []
      },
      {
        "id": "pf-testimonials",
        "name": "Testimonial cards",
        "selector": [
          ".social-proof-ratings"
        ],
        "style": "pf-testimonials",
        "blocks": [
          "carousel-testimonial"
        ],
        "defaultContent": [
          ".social-proof-ratings h2"
        ]
      },
      {
        "id": "pf-inventory-media",
        "name": "Purchase/organize inventory (image+text)",
        "selector": [
          ".section4:not(.section4r)"
        ],
        "style": "pf-media-right",
        "blocks": [
          "columns-media"
        ],
        "defaultContent": []
      },
      {
        "id": "pf-inventory-features",
        "name": "Inventory feature grid",
        "selector": [
          ".section5:not(.section5r):not(.section5last)"
        ],
        "style": "pf-features",
        "blocks": [
          "cards-features"
        ],
        "defaultContent": []
      },
      {
        "id": "pf-analyze-media",
        "name": "Collect/analyze data (image+text)",
        "selector": [
          "#analyze-audits"
        ],
        "style": "pf-media-left",
        "blocks": [
          "columns-media"
        ],
        "defaultContent": []
      },
      {
        "id": "pf-analyze-features",
        "name": "Analytics feature grid",
        "selector": [
          ".section3r"
        ],
        "style": "pf-features",
        "blocks": [
          "cards-features"
        ],
        "defaultContent": []
      },
      {
        "id": "pf-integrate-media",
        "name": "Integrate CMMS (image+text)",
        "selector": [
          ".section4r"
        ],
        "style": "pf-media-right",
        "blocks": [
          "columns-media"
        ],
        "defaultContent": []
      },
      {
        "id": "pf-integrate-features-callout",
        "name": "Integration features + stats callout",
        "selector": [
          ".section5r"
        ],
        "style": "pf-features",
        "blocks": [
          "cards-features",
          "columns-callout"
        ],
        "defaultContent": []
      },
      {
        "id": "pf-mobile-media",
        "name": "Manage from anywhere (image+text)",
        "selector": [
          ".section2.section2last"
        ],
        "style": "pf-media-left",
        "blocks": [
          "columns-media"
        ],
        "defaultContent": []
      },
      {
        "id": "pf-mobile-features",
        "name": "Mobile feature grid",
        "selector": [
          ".section3.section3last"
        ],
        "style": "pf-features",
        "blocks": [
          "cards-features"
        ],
        "defaultContent": []
      },
      {
        "id": "pf-casestudy-carousel",
        "name": "Case study + explore solution",
        "selector": [
          ".section6"
        ],
        "style": "pf-explore",
        "blocks": [
          "carousel-testimonial",
          "columns-logos",
          "accordion-faq"
        ],
        "defaultContent": [
          ".section6 > .container > h2"
        ]
      },
      {
        "id": "pf-resources",
        "name": "Resource card trio",
        "selector": [
          ".section7"
        ],
        "style": "pf-resources",
        "blocks": [
          "cards-cta"
        ],
        "defaultContent": [
          ".section7 > .container > h2"
        ]
      },
      {
        "id": "pf-final-cta",
        "name": "Final CTA",
        "selector": [
          ".home-seemore"
        ],
        "style": "pf-final-cta",
        "blocks": [],
        "defaultContent": [
          ".home-seemore h2",
          ".home-seemore p",
          ".home-seemore .container ul"
        ]
      }
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
        let elements = [];
        try {
          elements = document.querySelectorAll(selector);
        } catch (e) {
          console.warn(`Invalid selector for "${blockDef.name}": ${selector}`);
        }
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
  var import_product_feature_page_default = {
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
  return __toCommonJS(import_product_feature_page_exports);
})();
