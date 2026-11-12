const test = require("node:test");
const assert = require("node:assert");

// Instala los seams del DOM y localStorage para auth-guard.js.
// `pathname`: ruta de location.pathname.
// `user`: valor de sobremesa_user (string JSON) o undefined para ausente.
// `token`: valor de sobremesa_token o undefined.
// `docReady`: "complete" | "loading".
function installAuthGuardSeams({ pathname, user, token, docReady = "complete" }) {
  const store = {};
  if (user !== undefined) {
    store.sobremesa_user = user;
  }
  if (token !== undefined) {
    store.sobremesa_token = token;
  }

  const adminLink = { style: { display: null } };
  const handlers = {};

  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = val; },
    removeItem: (key) => { delete store[key]; }
  };
  global.window = {
    location: { pathname, href: "" }
  };
  global.document = {
    readyState: docReady,
    addEventListener: (type, handler) => {
      (handlers[type] ??= []).push(handler);
    },
    getElementById: (id) => (id === "nav-admin" ? adminLink : null)
  };

  return {
    store,
    adminLink,
    emitDOMContentLoaded: () => {
      (handlers["DOMContentLoaded"] ?? []).forEach((h) => h());
    }
  };
}

function requireAuthGuard() {
  delete require.cache[require.resolve("../js/auth-guard.js")];
  return require("../js/auth-guard.js");
}

test("auth-guard redirects when user is missing and not on auth page", () => {
  installAuthGuardSeams({ pathname: "/index.html" });
  requireAuthGuard();
  assert.strictEqual(global.window.location.href, "html/auth.html");
});

test("auth-guard does not redirect when user exists", () => {
  installAuthGuardSeams({ pathname: "/index.html", user: "testuser", token: "tok" });
  requireAuthGuard();
  assert.strictEqual(global.window.location.href, "");
});

test("auth-guard descarta una sesión sin token y redirige al login", () => {
  const { store } = installAuthGuardSeams({
    pathname: "/index.html",
    user: JSON.stringify({ email: "admin@lasobremesa.local" })
  });
  requireAuthGuard();
  assert.strictEqual(global.window.location.href, "html/auth.html");
  assert.strictEqual(store.sobremesa_user, undefined);
});

test("auth-guard does not redirect on auth page even if user is missing", () => {
  installAuthGuardSeams({ pathname: "/html/auth.html" });
  requireAuthGuard();
  assert.strictEqual(global.window.location.href, "");
});

test("auth-guard redirects from /html/ to auth.html when user is missing", () => {
  installAuthGuardSeams({ pathname: "/html/ajedrez.html" });
  requireAuthGuard();
  assert.strictEqual(global.window.location.href, "auth.html");
});

test("auth-guard does not redirect from html/ when user exists", () => {
  installAuthGuardSeams({ pathname: "/html/ajedrez.html", user: "testuser", token: "tok" });
  requireAuthGuard();
  assert.strictEqual(global.window.location.href, "");
});

test("logout removes user and token and redirects from html/ to auth.html", () => {
  const { store } = installAuthGuardSeams({
    pathname: "/html/ajedrez.html",
    user: JSON.stringify({ email: "a@b.com" }),
    token: "tok"
  });
  requireAuthGuard();
  global.window.logout();
  assert.strictEqual(store.sobremesa_user, undefined);
  assert.strictEqual(store.sobremesa_token, undefined);
  assert.strictEqual(global.window.location.href, "auth.html");
});

test("logout redirects from index.html to html/auth.html", () => {
  installAuthGuardSeams({ pathname: "/index.html", user: "x" });
  requireAuthGuard();
  global.window.logout();
  assert.strictEqual(global.window.location.href, "html/auth.html");
});

test("auth-guard shows admin link when user has ADMIN role", () => {
  const { adminLink } = installAuthGuardSeams({
    pathname: "/html/admin.html",
    user: JSON.stringify({ role: "ADMIN", email: "a@b.com" }),
    token: "tok"
  });
  requireAuthGuard();
  assert.strictEqual(adminLink.style.display, "inline-block");
});

test("auth-guard hides admin link when only the user email is admin@lasobremesa.local (role USER)", () => {
  const { adminLink } = installAuthGuardSeams({
    pathname: "/html/admin.html",
    user: JSON.stringify({ role: "USER", email: "admin@lasobremesa.local" })
  });
  requireAuthGuard();
  assert.notStrictEqual(adminLink.style.display, "inline-block");
});

test("auth-guard keeps admin link hidden for a regular user", () => {
  const { adminLink } = installAuthGuardSeams({
    pathname: "/html/admin.html",
    user: JSON.stringify({ role: "USER", email: "user@test.com" })
  });
  requireAuthGuard();
  assert.notStrictEqual(adminLink.style.display, "inline-block");
});

test("auth-guard shows admin link when token payload role is ADMIN", () => {
  const payload = Buffer.from(JSON.stringify({ role: "ADMIN", sub: 9 })).toString("base64");
  const { adminLink } = installAuthGuardSeams({
    pathname: "/html/admin.html",
    user: JSON.stringify({ role: "USER", email: "user@test.com" }),
    token: `header.${payload}.sig`
  });
  requireAuthGuard();
  assert.strictEqual(adminLink.style.display, "inline-block");
});

test("auth-guard hides admin link when only the token payload email is admin@lasobremesa.local", () => {
  const payload = Buffer.from(JSON.stringify({ email: "admin@lasobremesa.local" })).toString("base64");
  const { adminLink } = installAuthGuardSeams({
    pathname: "/html/admin.html",
    user: JSON.stringify({ role: "USER", email: "user@test.com" }),
    token: `header.${payload}.sig`
  });
  requireAuthGuard();
  assert.notStrictEqual(adminLink.style.display, "inline-block");
});

test("auth-guard hides admin link when token payload sub is 1 without ADMIN role", () => {
  const payload = Buffer.from(JSON.stringify({ sub: 1 })).toString("base64");
  const { adminLink } = installAuthGuardSeams({
    pathname: "/html/admin.html",
    user: JSON.stringify({ role: "USER", email: "user@test.com" }),
    token: `header.${payload}.sig`
  });
  requireAuthGuard();
  assert.notStrictEqual(adminLink.style.display, "inline-block");
});

test("auth-guard ignores malformed token payload", () => {
  const { adminLink } = installAuthGuardSeams({
    pathname: "/html/admin.html",
    user: JSON.stringify({ role: "USER", email: "user@test.com" }),
    token: "header.notbase64.sig"
  });
  requireAuthGuard();
  assert.notStrictEqual(adminLink.style.display, "inline-block");
});

test("auth-guard runs checkAdminDisplay on DOMContentLoaded when document is loading", () => {
  const { adminLink, emitDOMContentLoaded } = installAuthGuardSeams({
    pathname: "/html/admin.html",
    docReady: "loading",
    user: JSON.stringify({ role: "ADMIN", email: "a@b.com" }),
    token: "tok"
  });
  requireAuthGuard();
  emitDOMContentLoaded();
  assert.strictEqual(adminLink.style.display, "inline-block");
});

test("auth-guard no hace nada si el documento desaparece antes de DOMContentLoaded", () => {
  const { adminLink, emitDOMContentLoaded } = installAuthGuardSeams({
    pathname: "/index.html",
    user: JSON.stringify({ role: "ADMIN" }),
    token: "tok",
    docReady: "loading"
  });
  requireAuthGuard();
  const savedDocument = global.document;
  delete global.document;
  try {
    assert.doesNotThrow(() => emitDOMContentLoaded());
  } finally {
    global.document = savedDocument;
  }
  assert.strictEqual(adminLink.style.display, null);
});

test("auth-guard tolera que no exista el enlace de admin en la página", () => {
  installAuthGuardSeams({
    pathname: "/html/memoria.html",
    user: JSON.stringify({ role: "ADMIN" }),
    token: "tok"
  });
  global.document.getElementById = () => null;
  assert.doesNotThrow(() => requireAuthGuard());
  assert.strictEqual(global.window.location.href, "");
});

test("auth-guard ignora un usuario guardado con JSON malformado", () => {
  const { adminLink } = installAuthGuardSeams({
    pathname: "/index.html",
    user: "{no-es-json",
    token: "tok"
  });
  requireAuthGuard();
  assert.strictEqual(adminLink.style.display, null);
});

test("auth-guard expone logout en window", () => {
  installAuthGuardSeams({ pathname: "/index.html", user: "{}", token: "tok" });
  requireAuthGuard();
  assert.strictEqual(typeof global.window.logout, "function");
});
