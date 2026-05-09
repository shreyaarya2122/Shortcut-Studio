"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function makeEl(tag = "div") {
  const el = {
    tagName: tag,
    children: [],
    listeners: {},
    attributes: {},
    style: {},
    dataset: {},
    _innerHTML: "",
    value: "",
    textContent: "",
    get innerHTML() {
      return this._innerHTML;
    },
    set innerHTML(v) {
      this._innerHTML = String(v);
    },
    setAttribute(k, v) {
      this.attributes[k] = v;
      if (k === "data-theme") this._theme = v;
    },
    getAttribute(k) {
      return this.attributes[k] || null;
    },
    addEventListener(name, fn) {
      this.listeners[name] = this.listeners[name] || [];
      this.listeners[name].push(fn);
    },
    dispatch(name, evt = {}) {
      (this.listeners[name] || []).forEach((fn) => fn({ preventDefault() {}, ...evt }));
    },
    focus() {},
    appendChild(c) {
      this.children.push(c);
    },
    querySelectorAll() {
      return [];
    },
  };
  return el;
}

function buildDocument() {
  const elements = {
    "#generator-form": makeEl("form"),
    "#topic": makeEl("input"),
    "#script-list": makeEl("section"),
    "#status": makeEl("p"),
    "#reset": makeEl("button"),
    "#regenerate": makeEl("button"),
    "[data-theme-toggle]": makeEl("button"),
    "#category": makeEl("select"),
    "#audience": makeEl("input"),
    "#tone": makeEl("select"),
    "#pace": makeEl("select"),
  };
  elements["#category"].value = "hybrid";
  elements["#audience"].value = "curious viewers";
  elements["#tone"].value = "curious";
  elements["#pace"].value = "balanced";

  const document = {
    querySelector(sel) {
      return elements[sel] || makeEl();
    },
    querySelectorAll() {
      return [];
    },
    documentElement: makeEl("html"),
  };

  return { document, elements };
}

function run() {
  const { document, elements } = buildDocument();
  const sandbox = {
    document,
    window: {
      matchMedia: () => ({ matches: false }),
    },
    HTMLFormElement: { prototype: { reset() {} } },
    setTimeout,
    clearTimeout,
    console,
    navigator: { clipboard: { writeText: async () => {} } },
  };
  vm.createContext(sandbox);
  const code = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  vm.runInContext(code, sandbox);

  // Scenario 1: dangerous prank ideas for kids
  elements["#topic"].value = "dangerous prank ideas for kids";
  elements["#generator-form"].dispatch("submit");

  const html = elements["#script-list"].innerHTML;
  const status = elements["#status"].textContent;
  const verbosePhrase =
    "Why this trend is risky and what creators can do instead: a safe-creator breakdown of dangerous prank ideas for kids";

  // Banner should still contain the verbose reframe.
  if (!html.includes("policy-banner")) {
    throw new Error("Expected policy banner to render for sensitive topic.");
  }
  // Banner should display the verbose reframe (it's allowed there).
  if (!html.includes("Reframed as:")) {
    throw new Error("Expected 'Reframed as:' label in policy banner.");
  }

  // Pull only the script-card portion (after the banner) and verify the verbose phrase doesn't appear.
  const cardsStart = html.indexOf("script-card");
  if (cardsStart === -1) {
    throw new Error("Expected script cards to render.");
  }
  const cardsHtml = html.slice(cardsStart);

  if (cardsHtml.includes(verbosePhrase)) {
    throw new Error(
      "FAIL: Script cards still contain the verbose reframe phrase.\nFound: " + verbosePhrase,
    );
  }

  // Also assert the original harmful phrase is not parroted across cards.
  // (It may appear once in the banner's "Your topic:" line, but never in a card.)
  if (cardsHtml.toLowerCase().includes("dangerous prank ideas for kids")) {
    throw new Error(
      "FAIL: Original harmful phrase 'dangerous prank ideas for kids' appears inside a script card.",
    );
  }

  // Cards should reflect a concise creator topic — at least one of the variants.
  const variants = ["risky prank trends", "unsafe prank content", "dangerous prank trends", "harmful viral challenges"];
  if (!variants.some((v) => cardsHtml.toLowerCase().includes(v))) {
    throw new Error(
      "FAIL: No concise creator topic variant found in script cards. Expected one of: " + variants.join(", "),
    );
  }

  // Safe angle phrase should appear in tips/beats.
  if (!cardsHtml.toLowerCase().includes("why creators should avoid them and what to do instead")) {
    throw new Error("FAIL: Safe angle missing from script cards.");
  }

  // Per-script YouTube safety section preserved.
  const safetyMatches = (cardsHtml.match(/safety-section/g) || []).length;
  if (safetyMatches < 3) {
    throw new Error("FAIL: Expected 3 per-script safety sections, found " + safetyMatches);
  }

  // Status string should reflect reframing.
  if (!/reframed/i.test(status)) {
    throw new Error("FAIL: Status line should mention reframing. Got: " + status);
  }

  // Scenario 2: regeneration produces a different signature for sensitive topic.
  const firstHtml = cardsHtml;
  elements["#regenerate"].dispatch("click");
  const secondHtml = elements["#script-list"].innerHTML;
  if (secondHtml === html) {
    throw new Error("FAIL: Regeneration produced identical output.");
  }

  // Scenario 3: clean topic produces no banner.
  elements["#topic"].value = "iphone photography tips";
  elements["#reset"].dispatch("click");
  elements["#topic"].value = "iphone photography tips";
  elements["#generator-form"].dispatch("submit");
  const cleanHtml = elements["#script-list"].innerHTML;
  if (cleanHtml.includes("policy-banner")) {
    throw new Error("FAIL: Clean topic should not show policy banner.");
  }
  if (!cleanHtml.toLowerCase().includes("iphone photography tips")) {
    throw new Error("FAIL: Clean topic missing from cards.");
  }

  console.log("All smoke checks passed.");
}

run();
