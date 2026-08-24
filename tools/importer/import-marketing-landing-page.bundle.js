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

  // tools/importer/import-marketing-landing-page.js
  var import_marketing_landing_page_exports = {};
  __export(import_marketing_landing_page_exports, {
    default: () => import_marketing_landing_page_default
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

  // tools/importer/parsers/case-study-highlight.js
  function parse2(element, { document }) {
    const normalizeLazy = (root) => root.querySelectorAll("img").forEach((img) => {
      if (!img.getAttribute("src")) {
        const lazy = img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
        if (lazy) img.setAttribute("src", lazy);
      }
    });
    normalizeLazy(element);
    const quote = element.querySelector(".what-text blockquote, blockquote");
    const author = element.querySelector(".what-text .author, .author");
    const image = author?.querySelector("picture, img") || null;
    const details = author?.querySelector("p") || null;
    const stats = [...element.querySelectorAll(".stats li")];
    if (!quote && stats.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[quote || "", image || "", details || ""]];
    stats.forEach((stat) => {
      const metric = stat.querySelector("strong");
      const label = document.createElement("p");
      [...stat.childNodes].forEach((node) => {
        if (node !== metric) label.append(node);
      });
      const direction = stat.classList.contains("minus") ? "minus" : "plus";
      cells.push([direction, metric || "", label.textContent.trim() ? label : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "case-study-highlight",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-cta.js
  function parse3(element, { document }) {
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
      const block2 = WebImporter.Blocks.createBlock(document, { name: "cards-cta (article)", cells: cells2 });
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

  // tools/importer/parsers/cards-icon.js
  function parse4(element, { document }) {
    const normalizeLazy = (root) => root.querySelectorAll("img").forEach((img) => {
      if (!img.getAttribute("src")) {
        const lazy = img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
        if (lazy) img.setAttribute("src", lazy);
      }
    });
    const preserveBefore = (node) => {
      if (node && node.parentNode) element.parentNode.insertBefore(node, element);
    };
    const iconCells = Array.from(element.querySelectorAll(
      ":scope > .container > .RA-four-flex > .flex-item, :scope .RA-four-flex > .flex-item, :scope .flex-item, :scope .connect-grid > article, :scope .benefits > article, :scope .container > article"
    ));
    const isMarketing = element.matches("section.philosophy, section.connect") || iconCells.length > 0;
    if (isMarketing && iconCells.length > 0) {
      normalizeLazy(element);
      const container = element.querySelector(":scope > .container") || element;
      Array.from(container.children).forEach((c) => {
        if (iconCells.includes(c)) return;
        const holdsCell = iconCells.some((cell) => c.contains(cell));
        if (holdsCell) return;
        if (/^(H1|H2|H3|H4)$/.test(c.tagName) || c.tagName === "P" || c.tagName === "A") preserveBefore(c);
      });
      const cells2 = [];
      iconCells.forEach((cell) => {
        const icon = cell.querySelector("figure img, figure picture, img, picture");
        const textCell = [];
        const heading = cell.querySelector("h1, h2, h3, h4");
        if (heading) textCell.push(heading);
        Array.from(cell.querySelectorAll(":scope > p, :scope > div > p")).forEach((p) => textCell.push(p));
        const cta = cell.querySelector("a[href]");
        if (cta && !textCell.includes(cta)) {
          cta.querySelectorAll(".sr-only").forEach((s) => s.remove());
          textCell.push(cta);
        }
        if (!icon && textCell.length === 0) return;
        cells2.push([icon || "", textCell.length ? textCell : ""]);
      });
      if (cells2.length === 0) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document, { name: "cards-icon", cells: cells2 });
      element.replaceWith(block2);
      return;
    }
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

  // tools/importer/parsers/cards-timeline.js
  function parse5(element, { document }) {
    const list = element.querySelector("ul, ol");
    const items = list ? Array.from(list.querySelectorAll(":scope > li")) : Array.from(element.querySelectorAll(":scope > .container > ul > li, li"));
    const heading = element.querySelector(":scope > .container > h2, :scope > h2, h2");
    if (heading && heading.parentNode) element.parentNode.insertBefore(heading, element);
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((li) => {
      const icon = li.querySelector("picture, img");
      const paras = Array.from(li.querySelectorAll(":scope > p"));
      const isYear = (p) => {
        const t = p.textContent.trim();
        return t.length <= 12 && /\d/.test(t) && !p.querySelector("a");
      };
      let yearP = [...paras].reverse().find((p) => p.classList.contains("pad") && isYear(p)) || [...paras].reverse().find(isYear) || null;
      const labelParas = paras.filter((p) => p !== yearP && p.textContent.trim() !== "");
      const cell = [];
      labelParas.forEach((p) => cell.push(p));
      if (yearP) cell.push(yearP);
      if (!icon && cell.length === 0) return;
      if (icon) {
        cells.push([icon, cell.length ? cell : ""]);
      } else {
        cells.push([cell]);
      }
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-timeline", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  function parse6(element, { document }) {
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
  function parse7(element, { document }) {
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

  // tools/importer/parsers/tabs-feature.js
  function parse8(element, { document }) {
    const norm = (t) => (t || "").replace(/\s+/g, " ").trim();
    const preserveBefore = (node) => {
      if (node && node.parentNode) element.parentNode.insertBefore(node, element);
    };
    const normalizeLazy = (root) => root.querySelectorAll("img").forEach((img) => {
      if (!img.getAttribute("src")) {
        const lazy = img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
        if (lazy) img.setAttribute("src", lazy);
      }
    });
    const twoToggleLabels = Array.from(element.querySelectorAll(".feature-selector-twotoggle a"));
    if (twoToggleLabels.length) {
      normalizeLazy(element);
      const heading = element.querySelector(":scope > .container > h2, :scope > h2");
      if (heading) preserveBefore(heading);
      const panelRoot = element.querySelector(".feature-item") || element;
      const panels = Array.from(panelRoot.querySelectorAll(":scope > .item"));
      const cells2 = [];
      panels.forEach((panel, i) => {
        const label = document.createElement("p");
        label.textContent = norm(twoToggleLabels[i] ? twoToggleLabels[i].textContent : `Tab ${i + 1}`);
        const panelCell = [];
        const media2 = panel.querySelector(".mobile-cont figure img, .mobile-cont figure picture, figure img, img");
        if (media2) panelCell.push(media2);
        const list = panel.querySelector(".mobile-cont > ol, .mobile-cont > ul, :scope ol, :scope ul");
        if (list) panelCell.push(list);
        panel.querySelectorAll(":scope > h2, :scope > h3, :scope > h4, :scope > p").forEach((p) => panelCell.push(p));
        cells2.push([label, panelCell.length ? panelCell : ""]);
      });
      if (cells2.length === 0) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document, { name: "tabs-feature", cells: cells2 });
      element.replaceWith(block2);
      return;
    }
    if (element.id === "homepage" || element.matches("#homepage")) {
      normalizeLazy(element);
      const inner = element.querySelector("#feature-container") || element;
      const container = inner.querySelector(":scope > .container") || inner;
      const logo = container.querySelector(":scope > figure.foresight-logo, :scope > figure");
      const h2 = container.querySelector(":scope > h2");
      [logo, h2].forEach(preserveBefore);
      const featureItem = element.querySelector(".feature-item");
      const items2 = featureItem ? Array.from(featureItem.querySelectorAll(":scope > .item")) : [];
      let panelFig = featureItem ? featureItem.nextElementSibling : null;
      while (panelFig && panelFig.tagName !== "FIGURE") panelFig = panelFig.nextElementSibling;
      if (!panelFig) panelFig = Array.from(element.querySelectorAll("figure")).find((f) => f.querySelector("img.showvisual, img"));
      const media2 = panelFig ? Array.from(panelFig.querySelectorAll(":scope > img, :scope > picture")) : [];
      if (items2.length) {
        const cells2 = [];
        items2.forEach((item, i) => {
          const h3 = item.querySelector("h3");
          let labelCell;
          if (h3) {
            const label = document.createElement("p");
            const link = h3.querySelector("a");
            label.textContent = norm(link ? link.textContent : h3.textContent);
            labelCell = label;
          } else {
            labelCell = `Tab ${i + 1}`;
          }
          const panelCell = [];
          Array.from(item.children).forEach((child) => {
            if (child !== h3) panelCell.push(child);
          });
          if (media2[i]) panelCell.push(media2[i]);
          cells2.push([labelCell, panelCell.length ? panelCell : ""]);
        });
        const block2 = WebImporter.Blocks.createBlock(document, { name: "tabs-feature", cells: cells2 });
        element.replaceWith(block2);
        return;
      }
    }
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
        if (child === h3) return;
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

  // tools/importer/import-marketing-landing-page.js
  var parsers = {
    "accordion-faq": parse,
    "case-study-highlight": parse2,
    "cards-cta": parse3,
    "cards-icon": parse4,
    "cards-timeline": parse5,
    "columns-media": parse6,
    "hero-cta": parse7,
    "tabs-feature": parse8
  };
  var PAGE_TEMPLATE = {
    "name": "marketing-landing-page",
    "description": "Newer Fiix marketing landing page using a <main> landmark: split hero (copy + illustration), icon/stat grids, product feature blocks with alternating imagery, tabbed panels, benefit cards, two-column comparison, long FAQ accordion, and paired CTA articles.",
    "urls": [
      "https://fiixsoftware.com/cmms/ai/",
      "https://fiixsoftware.com/optix/"
    ],
    "blocks": [
      {
        "name": "columns-media",
        "instances": [
          "main > header.container",
          "main > section.fiixMAX-info",
          "main > section.augury",
          "main > section.what-is-it",
          "main > section.together"
        ]
      },
      {
        "name": "case-study-highlight",
        "instances": [
          "main > section.case-study"
        ]
      },
      {
        "name": "cards-timeline",
        "instances": [
          "main > section.timeline"
        ]
      },
      {
        "name": "cards-icon",
        "instances": [
          "main > section.philosophy",
          "main > section.connect"
        ]
      },
      {
        "name": "accordion-faq",
        "instances": [
          "#RA-faq",
          "main > section#RA-faq"
        ]
      },
      {
        "name": "tabs-feature",
        "instances": [
          "#homepage",
          "main > section.integrations-feature"
        ]
      },
      {
        "name": "cards-cta",
        "instances": [
          "main > section.dualCTA-box"
        ]
      },
      {
        "name": "hero-cta",
        "instances": [
          "main > section.container .get-started, main > section.get-started"
        ]
      }
    ],
    "sections": [
      {
        "id": "ai-hero",
        "name": "Hero (Balanced Approach to AI)",
        "selector": [
          "main > header.container"
        ],
        "style": "ai-hero",
        "blocks": [
          "columns-media"
        ],
        "defaultContent": []
      },
      {
        "id": "ai-timeline",
        "name": "AI at Fiix timeline",
        "selector": [
          "main > section.timeline"
        ],
        "style": "ai-timeline",
        "blocks": [
          "cards-timeline"
        ],
        "defaultContent": [
          "main > section.timeline > h2"
        ]
      },
      {
        "id": "ai-fiixmax",
        "name": "Fiix MAX product block",
        "selector": [
          "main > section.fiixMAX-info"
        ],
        "style": "ai-fiixmax",
        "blocks": [
          "columns-media"
        ],
        "defaultContent": []
      },
      {
        "id": "ai-philosophy",
        "name": "AI Philosophy icon grid",
        "selector": [
          "main > section.philosophy"
        ],
        "style": "ai-philosophy",
        "blocks": [
          "cards-icon"
        ],
        "defaultContent": [
          "main > section.philosophy > h2"
        ]
      },
      {
        "id": "ai-augury",
        "name": "Fiix Asset Health / Augury",
        "selector": [
          "main > section.augury"
        ],
        "style": "ai-augury",
        "blocks": [
          "columns-media"
        ],
        "defaultContent": []
      },
      {
        "id": "ai-cbm-faq",
        "name": "Predictive Maintenance vs CBM Q&A",
        "selector": [
          "#RA-faq",
          "main > section#RA-faq"
        ],
        "style": "ai-faq",
        "blocks": [
          "accordion-faq"
        ],
        "defaultContent": []
      },
      {
        "id": "ai-foresight-tabs",
        "name": "Fiix Foresight tabbed panel",
        "selector": [
          "#homepage"
        ],
        "style": "ai-tabs",
        "blocks": [
          "tabs-feature"
        ],
        "defaultContent": []
      },
      {
        "id": "ai-assetinsights-tabs",
        "name": "See Asset Insights in Action tabs",
        "selector": [
          "main > section.integrations-feature"
        ],
        "style": "ai-tabs",
        "blocks": [
          "tabs-feature"
        ],
        "defaultContent": []
      },
      {
        "id": "ai-dual-cta",
        "name": "Dual CTA articles",
        "selector": [
          "main > section.dualCTA-box"
        ],
        "style": "ai-dual-cta",
        "blocks": [
          "cards-cta"
        ],
        "defaultContent": []
      },
      {
        "id": "optix-what-is-it",
        "name": "What is FactoryTalk Optix",
        "selector": [
          "main > section.what-is-it"
        ],
        "style": "optix-intro",
        "blocks": [
          "columns-media"
        ],
        "defaultContent": []
      },
      {
        "id": "optix-connect",
        "name": "Connect to plant floor icon grid + benefits",
        "selector": [
          "main > section.connect"
        ],
        "style": "optix-connect",
        "blocks": [
          "cards-icon"
        ],
        "defaultContent": [
          "main > section.connect > h2"
        ]
      },
      {
        "id": "optix-case-study",
        "name": "Case study quote + stats",
        "selector": [
          "main > section.case-study"
        ],
        "style": null,
        "blocks": [
          "case-study-highlight"
        ],
        "defaultContent": []
      },
      {
        "id": "optix-together",
        "name": "Fiix and FactoryTalk Better Together",
        "selector": [
          "main > section.together"
        ],
        "style": "optix-together",
        "blocks": [
          "columns-media"
        ],
        "defaultContent": []
      },
      {
        "id": "optix-getting-started",
        "name": "Getting Started CTA",
        "selector": [
          "main > section.container .get-started, main > section.get-started"
        ],
        "style": "optix-getstarted",
        "blocks": [
          "hero-cta"
        ],
        "defaultContent": []
      },
      {
        "id": "optix-faq",
        "name": "Optix FAQ accordion",
        "selector": [
          "main > section#RA-faq"
        ],
        "style": "optix-faq",
        "blocks": [
          "accordion-faq"
        ],
        "defaultContent": []
      }
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
  var import_marketing_landing_page_default = {
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
  return __toCommonJS(import_marketing_landing_page_exports);
})();
