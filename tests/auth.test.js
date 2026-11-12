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

test("auth.js handleLogin sin backend avisa y no crea sesión falsa", async () => {
  const store = {};
  const alerts = [];
  global.alert = (msg) => alerts.push(msg);
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
  assert.strictEqual(global.window.location.href, "");
  assert.strictEqual(store.sobremesa_user, undefined);
  assert.ok(alerts[0].includes("No se pudo conectar con el servidor"));
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

test("auth.js handleRegister sin backend avisa y no crea sesión falsa", async () => {
  const store = {};
  const alerts = [];
  global.alert = (msg) => alerts.push(msg);
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
  assert.strictEqual(global.window.location.href, "");
  assert.strictEqual(store.sobremesa_user, undefined);
  assert.ok(alerts[0].includes("No se pudo conectar con el servidor"));
});

test("auth.js no redirige si hay usuario guardado pero no token", () => {
  global.localStorage = {
    getItem: (k) => (k === "sobremesa_user" ? JSON.stringify({ email: "a@b.com" }) : null),
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

  assert.strictEqual(global.window.location.href, "");
});

test("auth.js redirects to index if already authenticated on load", () => {
  const session = { sobremesa_user: JSON.stringify({ id: 1 }), sobremesa_token: "tok" };
  global.localStorage = {
    getItem: (k) => session[k] ?? null,
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

// --- Casos adicionales -------------------------------------------------------

function installAuthSeams({ fetchImpl, fields = {} } = {}) {
  const store = {};
  const alerts = [];
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v; }
  };
  global.window = { location: { href: "" } };
  global.alert = (msg) => alerts.push(msg);
  global.document = {
    getElementById: (id) => (id in fields ? { value: fields[id] } : null)
  };
  global.fetch = fetchImpl;
  delete require.cache[require.resolve("../js/auth.js")];
  require("../js/auth.js");
  return { store, alerts };
}

test("auth.js handleLogin sin mensaje del backend muestra el texto por defecto", async () => {
  const { alerts, store } = installAuthSeams({
    fields: { "login-email": "a@a.com", "login-password": "x" },
    fetchImpl: async () => ({ ok: false, json: async () => ({}) })
  });
  await global.window.handleLogin({ preventDefault: () => {} });
  assert.deepStrictEqual(alerts, ["Error en la autenticación."]);
  assert.strictEqual(store.sobremesa_user, undefined);
  assert.strictEqual(global.window.location.href, "");
});

test("auth.js handleLogin sin access_token guarda el usuario pero no el token", async () => {
  const { store } = installAuthSeams({
    fields: { "login-email": "a@a.com", "login-password": "x" },
    fetchImpl: async () => ({ ok: true, json: async () => ({ user: { id: 7 } }) })
  });
  await global.window.handleLogin({ preventDefault: () => {} });
  assert.strictEqual(store.sobremesa_user, JSON.stringify({ id: 7 }));
  assert.strictEqual(store.sobremesa_token, undefined);
  assert.strictEqual(global.window.location.href, "../index.html");
});

test("auth.js handleLogin envía email y contraseña al endpoint de login", async () => {
  const requests = [];
  installAuthSeams({
    fields: { "login-email": "a@a.com", "login-password": "secreta" },
    fetchImpl: async (url, opts) => {
      requests.push({ url, opts });
      return { ok: true, json: async () => ({ user: {}, access_token: "t" }) };
    }
  });
  await global.window.handleLogin({ preventDefault: () => {} });
  assert.strictEqual(requests[0].url, "http://localhost:3000/auth/login");
  assert.strictEqual(requests[0].opts.method, "POST");
  assert.deepStrictEqual(JSON.parse(requests[0].opts.body), { email: "a@a.com", password: "secreta" });
});

test("auth.js switchTab activa el formulario y cambia el texto del pie", () => {
  const makeElement = () => {
    const classes = new Set();
    return {
      classes,
      classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) },
      innerHTML: ""
    };
  };
  const elements = {
    "form-login": makeElement(),
    "form-register": makeElement(),
    "tab-login": makeElement(),
    "tab-register": makeElement(),
    "auth-footer-text": makeElement()
  };
  global.document = { getElementById: (id) => elements[id] || null };
  global.localStorage = { getItem: () => null, setItem: () => {} };
  global.window = { location: { href: "" } };
  delete require.cache[require.resolve("../js/auth.js")];
  require("../js/auth.js");

  global.window.switchTab("register");
  assert.ok(elements["form-register"].classes.has("active"));
  assert.ok(!elements["form-login"].classes.has("active"));
  assert.ok(elements["tab-register"].classes.has("active"));
  assert.ok(elements["auth-footer-text"].innerHTML.includes("Inicia sesión aquí"));

  global.window.switchTab("login");
  assert.ok(elements["form-login"].classes.has("active"));
  assert.ok(!elements["form-register"].classes.has("active"));
  assert.ok(elements["tab-login"].classes.has("active"));
  assert.ok(!elements["tab-register"].classes.has("active"));
  assert.ok(elements["auth-footer-text"].innerHTML.includes("Regístrate aquí"));
});
