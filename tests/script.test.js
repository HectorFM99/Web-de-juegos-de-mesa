const test = require("node:test");
const assert = require("node:assert");

const SCRIPT_PATH = "../js/script.js";

function makeElement(extra = {}) {
  const attributes = {};
  const listeners = {};
  const classes = new Set();
  return {
    hidden: false,
    textContent: "",
    value: "",
    dataset: {},
    attributes,
    classList: {
      add: (c) => classes.add(c),
      contains: (c) => classes.has(c),
      toggle: (c, force) => (force ? classes.add(c) : classes.delete(c))
    },
    setAttribute(name, value) {
      attributes[name] = String(value);
    },
    addEventListener(type, handler) {
      (listeners[type] ??= []).push(handler);
    },
    emit(type) {
      (listeners[type] ?? []).forEach((handler) => handler());
    },
    ...extra
  };
}

function makeCard(name, category, title) {
  const heading = makeElement({ textContent: title });
  const card = makeElement({ querySelector: (sel) => (sel === "h3" ? heading : null) });
  card.dataset = { name, category };
  return card;
}

function makeFilter(filter, active = false) {
  const el = makeElement();
  el.dataset = { filter };
  if (active) el.classList.add("active");
  return el;
}

function loadScript() {
  const search = makeElement();
  const count = makeElement();
  const empty = makeElement({ hidden: true });
  const filters = [makeFilter("todos", true), makeFilter("estrategia"), makeFilter("cartas")];
  const cards = [
    makeCard("ajedrez", "estrategia", "Ajedrez"),
    makeCard("damas", "estrategia", "Damas"),
    makeCard("solitario", "cartas", "Solitario"),
    makeCard("conecta 4", "familiar", "Conecta 4")
  ];
  global.document = {
    querySelector(selector) {
      return { "#game-search": search, "#game-count": count, "#empty-state": empty }[selector] ?? null;
    },
    querySelectorAll(selector) {
      if (selector === ".filter") return filters;
      if (selector === ".game-card") return cards;
      return [];
    }
  };
  delete require.cache[require.resolve(SCRIPT_PATH)];
  require(SCRIPT_PATH);
  return { search, count, empty, filters, cards };
}

const visibleNames = (cards) => cards.filter((c) => !c.hidden).map((c) => c.dataset.name);

test("script: al cargar marca aria-pressed según el filtro activo", () => {
  const { filters } = loadScript();
  assert.deepStrictEqual(
    filters.map((f) => f.attributes["aria-pressed"]),
    ["true", "false", "false"]
  );
});

test("script: filtrar por categoría muestra solo sus juegos y actualiza el contador", () => {
  const { filters, cards, count, empty } = loadScript();
  filters[1].emit("click");
  assert.deepStrictEqual(visibleNames(cards), ["ajedrez", "damas"]);
  assert.strictEqual(count.textContent, "2 juegos");
  assert.strictEqual(empty.hidden, true);
  assert.deepStrictEqual(
    filters.map((f) => f.attributes["aria-pressed"]),
    ["false", "true", "false"]
  );
  assert.ok(filters[1].classList.contains("active"));
  assert.ok(!filters[0].classList.contains("active"));
});

test("script: un único resultado usa el singular 'juego'", () => {
  const { filters, count, cards } = loadScript();
  filters[2].emit("click");
  assert.deepStrictEqual(visibleNames(cards), ["solitario"]);
  assert.strictEqual(count.textContent, "1 juego");
});

test("script: la búsqueda ignora mayúsculas y espacios y busca en el título", () => {
  const { search, cards, count } = loadScript();
  search.value = "  DAMAS ";
  search.emit("input");
  assert.deepStrictEqual(visibleNames(cards), ["damas"]);
  assert.strictEqual(count.textContent, "1 juego");

  cards[3].dataset.name = "c4";
  search.value = "conecta";
  search.emit("input");
  assert.deepStrictEqual(visibleNames(cards), ["c4"]);
});

test("script: sin coincidencias muestra el estado vacío", () => {
  const { search, cards, count, empty } = loadScript();
  search.value = "parchís";
  search.emit("input");
  assert.deepStrictEqual(visibleNames(cards), []);
  assert.strictEqual(count.textContent, "0 juegos");
  assert.strictEqual(empty.hidden, false);
});

test("script: búsqueda y filtro se combinan", () => {
  const { search, filters, cards } = loadScript();
  filters[1].emit("click");
  search.value = "aje";
  search.emit("input");
  assert.deepStrictEqual(visibleNames(cards), ["ajedrez"]);
  filters[0].emit("click");
  assert.deepStrictEqual(visibleNames(cards), ["ajedrez"]);
  search.value = "";
  search.emit("input");
  assert.strictEqual(visibleNames(cards).length, 4);
});
