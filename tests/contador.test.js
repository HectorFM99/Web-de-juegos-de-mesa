const test = require("node:test");
const assert = require("node:assert");

const CONTADOR_PATH = "../js/contador.js";

function loadContador({ failingStorage = false } = {}) {
  const saludo = { innerHTML: "" };
  const store = {};
  global.document = { getElementById: (id) => (id === "saludo" ? saludo : null) };
  global.localStorage = {
    setItem(key, value) {
      if (failingStorage) throw new Error("QuotaExceededError");
      store[key] = String(value);
    }
  };
  delete require.cache[require.resolve(CONTADOR_PATH)];
  const { contar } = require(CONTADOR_PATH);
  return { saludo, store, contar };
}

test("contador: al cargar saluda al visitante en su primera visita y la guarda", () => {
  const { saludo, store } = loadContador();
  assert.strictEqual(saludo.innerHTML, "Hola visitante, es tu primera visita");
  assert.strictEqual(store.visitas, "1");
});

test("contador: la segunda y siguientes visitas cambian el saludo", () => {
  const { saludo, store, contar } = loadContador();
  contar("Ana");
  assert.strictEqual(saludo.innerHTML, "Hola Ana, es tu segunda visita");
  contar("Ana");
  assert.strictEqual(saludo.innerHTML, "Hola Ana, ya llevas 3 visitas");
  assert.strictEqual(store.visitas, "3");
});

test("contador: si localStorage falla el saludo se muestra igualmente", () => {
  let result;
  assert.doesNotThrow(() => {
    result = loadContador({ failingStorage: true });
  });
  assert.strictEqual(result.saludo.innerHTML, "Hola visitante, es tu primera visita");
});
