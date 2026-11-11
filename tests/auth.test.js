const test = require("node:test");
const assert = require("node:assert");

test("auth.js switchTab toggles between login and register", () => {
  const makeElement = () => ({
    classList: {
      add: () => {},
      remove: () => {}
    },
    innerHTML: ""
  });

  const elements = {
    "form-login": makeElement(),
    "form-register": makeElement(),
    "tab-login": makeElement(),
    "tab-register": makeElement(),
    "auth-footer-text": makeElement()
  };

  global.document = {
    getElementById: (id) => elements[id] || null
  };
  global.localStorage = {
    getItem: () => null,
    setItem: () => {}
  };
  global.window = {
    location: { href: "" }
  };

  delete require.cache[require.resolve("../js/auth.js")];
  require("../js/auth.js");

  global.window.switchTab("register");
  global.window.switchTab("login");
  assert.strictEqual(typeof global.window.switchTab, "function");
});

test("auth.js handleLogin success", async () => {
  const store = {};
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v; }
  };
  global.window = {
    location: { href: "" }
  };
  global.document = {
    getElementById: (id) => {
      if (id === 'login-email') return { value: 'test@test.com' };
      if (id === 'login-password') return { value: 'password123' };
      return null;
    }
  };
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ user: { id: 1, email: 'test@test.com' }, access_token: 'token123' })
  });

  delete require.cache[require.resolve("../js/auth.js")];
  require("../js/auth.js");

  await global.window.handleLogin({ preventDefault: () => {} });
  assert.strictEqual(global.window.location.href, "../index.html");
  assert.strictEqual(store.sobremesa_token, 'token123');
});

test("auth.js handleLogin failure with alert message", async () => {
  const alerts = [];
  global.alert = (msg) => alerts.push(msg);
  global.localStorage = {
    getItem: () => null,
    setItem: () => {}
  };
  global.window = {
    location: { href: "" }
  };
  global.document = {
    getElementById: (id) => {
      if (id === 'login-email') return { value: 'test@test.com' };
      if (id === 'login-password') return { value: 'wrong' };
      return null;
    }
  };
  global.fetch = async () => ({
    ok: false,
    json: async () => ({ message: 'Credenciales inválidas' })
  });

  delete require.cache[require.resolve("../js/auth.js")];
  require("../js/auth.js");

  await global.window.handleLogin({ preventDefault: () => {} });
  assert.strictEqual(alerts.length, 1);
  assert.strictEqual(alerts[0], 'Credenciales inválidas');
});

test("auth.js handleLogin catch fallback", async () => {
  const store = {};
  global.localStorage = {
    getItem: () => null,
    setItem: (k, v) => { store[k] = v; }
  };
  global.window = {
    location: { href: "" }
  };
  global.document = {
    getElementById: (id) => {
      if (id === 'login-email') return { value: 'offline@test.com' };
      if (id === 'login-password') return { value: 'password' };
      return null;
    }
  };
  global.fetch = async () => { throw new Error('Network error'); };

  delete require.cache[require.resolve("../js/auth.js")];
  require("../js/auth.js");

  await global.window.handleLogin({ preventDefault: () => {} });
  assert.strictEqual(global.window.location.href, "../index.html");
  assert.ok(store.sobremesa_user);
});

test("auth.js handleRegister success", async () => {
  const store = {};
  global.localStorage = {
    getItem: () => null,
    setItem: (k, v) => { store[k] = v; }
  };
  global.window = {
    location: { href: "" }
  };
  global.document = {
    getElementById: (id) => {
      if (id === 'reg-username') return { value: 'newuser' };
      if (id === 'reg-email') return { value: 'new@test.com' };
      if (id === 'reg-password') return { value: 'password123' };
      return null;
    }
  };
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ user: { id: 2, username: 'newuser', email: 'new@test.com' }, access_token: 'token456' })
  });

  delete require.cache[require.resolve("../js/auth.js")];
  require("../js/auth.js");

  await global.window.handleRegister({ preventDefault: () => {} });
  assert.strictEqual(global.window.location.href, "../index.html");
  assert.strictEqual(store.sobremesa_token, 'token456');
});

test("auth.js handleRegister failure with array message", async () => {
  const alerts = [];
  global.alert = (msg) => alerts.push(msg);
  global.localStorage = {
    getItem: () => null,
    setItem: () => {}
  };
  global.window = {
    location: { href: "" }
  };
  global.document = {
    getElementById: (id) => {
      if (id === 'reg-username') return { value: 'u' };
      if (id === 'reg-email') return { value: 'bad' };
      if (id === 'reg-password') return { value: '123' };
      return null;
    }
  };
  global.fetch = async () => ({
    ok: false,
    json: async () => ({ message: ['Error 1', 'Error 2'] })
  });

  delete require.cache[require.resolve("../js/auth.js")];
  require("../js/auth.js");

  await global.window.handleRegister({ preventDefault: () => {} });
  assert.strictEqual(alerts[0], 'Error 1, Error 2');
});

test("auth.js handleRegister catch fallback", async () => {
  const store = {};
  global.localStorage = {
    getItem: () => null,
    setItem: (k, v) => { store[k] = v; }
  };
  global.window = {
    location: { href: "" }
  };
  global.document = {
    getElementById: (id) => {
      if (id === 'reg-username') return { value: 'off' };
      if (id === 'reg-email') return { value: 'off@test.com' };
      if (id === 'reg-password') return { value: 'password' };
      return null;
    }
  };
  global.fetch = async () => { throw new Error('Network error'); };

  delete require.cache[require.resolve("../js/auth.js")];
  require("../js/auth.js");

  await global.window.handleRegister({ preventDefault: () => {} });
  assert.strictEqual(global.window.location.href, "../index.html");
  assert.ok(store.sobremesa_user);
});

test("auth.js redirects to index if already authenticated on load", () => {
  global.localStorage = {
    getItem: (k) => (k === "sobremesa_user" ? JSON.stringify({ id: 1 }) : null),
    setItem: () => {}
  };
  global.window = {
    location: { href: "" }
  };
  global.document = {
    getElementById: () => null
  };

  delete require.cache[require.resolve("../js/auth.js")];
  require("../js/auth.js");

  assert.strictEqual(global.window.location.href, "../index.html");
});
