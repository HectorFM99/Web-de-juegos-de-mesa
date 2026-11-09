const test = require("node:test");
const assert = require("node:assert");

test("auth-guard redirects when user is missing and not on auth page", () => {
  const store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = val; },
    removeItem: (key) => { delete store[key]; }
  };
  global.window = {
    location: { pathname: "/index.html", href: "" }
  };

  delete require.cache[require.resolve("../js/auth-guard.js")];
  require("../js/auth-guard.js");

  assert.strictEqual(global.window.location.href, "html/auth.html");
});

test("auth-guard does not redirect when user exists", () => {
  const store = { sobremesa_user: "testuser" };
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = val; },
    removeItem: (key) => { delete store[key]; }
  };
  global.window = {
    location: { pathname: "/index.html", href: "" }
  };

  delete require.cache[require.resolve("../js/auth-guard.js")];
  require("../js/auth-guard.js");

  assert.strictEqual(global.window.location.href, "");
});

test("auth-guard does not redirect on auth page even if user is missing", () => {
  const store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = val; },
    removeItem: (key) => { delete store[key]; }
  };
  global.window = {
    location: { pathname: "/html/auth.html", href: "" }
  };

  delete require.cache[require.resolve("../js/auth-guard.js")];
  require("../js/auth-guard.js");

  assert.strictEqual(global.window.location.href, "");
});

test("logout removes user and token and redirects correctly", () => {
  const store = { sobremesa_user: "testuser", sobremesa_token: "tok" };
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = val; },
    removeItem: (key) => { delete store[key]; }
  };
  global.window = {
    location: { pathname: "/html/ajedrez.html", href: "" }
  };

  delete require.cache[require.resolve("../js/auth-guard.js")];
  require("../js/auth-guard.js");
  global.window.logout();

  assert.strictEqual(store.sobremesa_user, undefined);
  assert.strictEqual(store.sobremesa_token, undefined);
  assert.strictEqual(global.window.location.href, "auth.html");

  global.window.location = { pathname: "/index.html", href: "" };
  global.window.logout();
  assert.strictEqual(global.window.location.href, "html/auth.html");
});
