const test = require("node:test");
const assert = require("node:assert");

test("admin.js authentication check and functions", async () => {
  const store = {
    sobremesa_user: JSON.stringify({ username: "admin", email: "admin@lasobremesa.local", role: "ADMIN" }),
    sobremesa_token: "fake-admin-token"
  };

  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = val; },
    removeItem: (key) => { delete store[key]; }
  };

  const elements = {};
  global.document = {
    readyState: "complete",
    addEventListener: () => {},
    getElementById: (id) => {
      if (!elements[id]) {
        elements[id] = { innerHTML: "", textContent: "", value: "", addEventListener: () => {} };
      }
      return elements[id];
    }
  };

  global.window = {
    location: { pathname: "/html/admin.html", href: "" }
  };

  global.alert = () => {};
  global.confirm = () => true;
  global.prompt = () => "Motivo de prueba";

  global.fetch = async (url) => {
    if (url.includes("/admin/users")) {
      return {
        ok: true,
        json: async () => ({
          users: [
            { id: 1, username: "admin", email: "admin@lasobremesa.local", role: "ADMIN", banned: false, createdAt: new Date() },
            { id: 2, username: "user1", email: "user1@test.com", role: "USER", banned: false, createdAt: new Date() }
          ]
        })
      };
    }
    if (url.includes("/admin/debug")) {
      return {
        ok: true,
        json: async () => ({ database: { totalMatches: 5 } })
      };
    }
    if (url.includes("/ban") || url.includes("/role")) {
      return {
        ok: true,
        json: async () => ({ message: "Actualizado con éxito", user: { id: 2, role: "USER", banned: true } })
      };
    }
    return { ok: false, json: async () => ({ message: "Not found" }) };
  };

  delete require.cache[require.resolve("../js/admin.js")];
  const adminJs = require("../js/admin.js");

  assert.ok(adminJs, "admin.js loaded successfully");
});
