const test = require("node:test");
const assert = require("node:assert");

const THEME_PATH = "../js/theme.js";
const STORAGE_KEY = "la-sobremesa-theme";

function makeElement(tag = "button") {
  const attributes = {};
  const listeners = {};
  return {
    tagName: tag.toUpperCase(),
    textContent: "",
    children: [],
    attributes,
    setAttribute(name, value) {
      attributes[name] = String(value);
    },
    addEventListener(type, handler) {
      (listeners[type] ??= []).push(handler);
    },
    append(...nodes) {
      this.children.push(...nodes);
    },
    replaceChildren(...nodes) {
      this.children = nodes;
    },
    click() {
      (listeners.click ?? []).forEach((handler) => handler());
    }
  };
}

function loadTheme({ saved, withMeta = true } = {}) {
  const store = {};
  if (saved !== undefined) {
    store[STORAGE_KEY] = saved;
  }
  const button = makeElement();
  const meta = makeElement("meta");
  global.localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = value;
    }
  };
  global.document = {
    body: { dataset: {} },
    querySelector(selector) {
      if (selector === ".theme-toggle") return button;
      if (selector === 'meta[name="theme-color"]') return withMeta ? meta : null;
      return null;
    },
    createElement: makeElement
  };
  delete require.cache[require.resolve(THEME_PATH)];
  require(THEME_PATH);
  return { store, button, meta };
}

function buttonText(button) {
  return button.children
    .map((child) => (typeof child === "string" ? child : child.textContent))
    .join("");
}

test("theme: sin preferencia guardada arranca en modo claro", () => {
  const { button, meta } = loadTheme();
  assert.strictEqual(global.document.body.dataset.theme, "light");
  assert.strictEqual(button.attributes["aria-pressed"], "false");
  assert.strictEqual(button.attributes["aria-label"], "Cambiar a modo oscuro");
  assert.strictEqual(buttonText(button), "☾ Modo oscuro");
  assert.strictEqual(button.children[0].attributes["aria-hidden"], "true");
  assert.strictEqual(meta.attributes.content, "#f5f0e5");
});

test("theme: respeta el modo oscuro guardado", () => {
  const { button, meta } = loadTheme({ saved: "dark" });
  assert.strictEqual(global.document.body.dataset.theme, "dark");
  assert.strictEqual(button.attributes["aria-pressed"], "true");
  assert.strictEqual(button.attributes["aria-label"], "Cambiar a modo claro");
  assert.strictEqual(buttonText(button), "☀ Modo claro");
  assert.strictEqual(meta.attributes.content, "#22251f");
});

test("theme: un valor guardado desconocido se trata como modo claro", () => {
  loadTheme({ saved: "sepia" });
  assert.strictEqual(global.document.body.dataset.theme, "light");
});

test("theme: pulsar el botón alterna el tema y lo guarda", () => {
  const { button, store } = loadTheme();
  button.click();
  assert.strictEqual(global.document.body.dataset.theme, "dark");
  assert.strictEqual(store[STORAGE_KEY], "dark");
  assert.strictEqual(buttonText(button), "☀ Modo claro");

  button.click();
  assert.strictEqual(global.document.body.dataset.theme, "light");
  assert.strictEqual(store[STORAGE_KEY], "light");
  assert.strictEqual(buttonText(button), "☾ Modo oscuro");
});

test("theme: funciona aunque la página no tenga meta theme-color", () => {
  const { button } = loadTheme({ withMeta: false });
  assert.doesNotThrow(() => button.click());
  assert.strictEqual(global.document.body.dataset.theme, "dark");
});
