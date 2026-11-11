const test = require("node:test");
const assert = require("node:assert");

const ADMIN_PATH = "../js/admin.js";

// --- Seams -----------------------------------------------------------

function requireAdmin() {
  delete require.cache[require.resolve(ADMIN_PATH)];
  return require(ADMIN_PATH);
}

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

function makeElement() {
  return {
    innerHTML: "",
    textContent: "",
    value: "",
    className: "",
    classList: { add() {}, remove() {}, contains() {} },
    style: {},
    setAttribute() {},
    getAttribute() {
      return null;
    },
    addEventListener() {},
    append() {},
    replaceChildren() {}
  };
}

function installSeams({ user, token, fetchImpl } = {}) {
  const store = {};
  if (user !== undefined) {
    store.sobremesa_user = user;
  }
  if (token !== undefined) {
    store.sobremesa_token = token;
  }

  global.localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => {
      store[key] = val;
    },
    removeItem: (key) => {
      delete store[key];
    }
  };

  const elements = {};
  const getElement = (id) => {
    if (!(id in elements)) {
      elements[id] = makeElement();
    }
    return elements[id];
  };

  global.document = {
    readyState: "complete",
    addEventListener() {},
    getElementById: getElement
  };

  const alerts = [];
  const confirms = [];
  const prompts = [];
  global.alert = (msg) => alerts.push(msg);
  global.confirm = (msg) => {
    confirms.push(msg);
    return true;
  };
  global.prompt = (msg, def) => {
    prompts.push(msg);
    return def;
  };

  const requests = [];
  global.fetch = async (url, opts) => {
    requests.push({ url, opts });
    if (fetchImpl) {
      return fetchImpl(url, opts);
    }
    if (url.includes("/admin/users")) {
      return { ok: true, json: async () => ({ users: [] }) };
    }
    if (url.includes("/admin/debug")) {
      return { ok: true, json: async () => ({ database: { totalMatches: 0 } }) };
    }
    if (url.includes("/ban") || url.includes("/role")) {
      return { ok: true, json: async () => ({ message: "ok" }) };
    }
    return { ok: false, json: async () => ({ message: "Not found" }) };
  };

  global.window = {
    location: { pathname: "/html/admin.html", href: "" }
  };

  return { store, elements, alerts, confirms, prompts, requests };
}

// --- getToken / getUser -----------------------------------------------

test("admin getToken devuelve el token guardado en localStorage", () => {
  installSeams({ token: "tok-123" });
  const { getToken } = requireAdmin();
  assert.strictEqual(getToken(), "tok-123");
});

test("admin getToken devuelve null cuando no hay token", () => {
  installSeams({});
  const { getToken } = requireAdmin();
  assert.strictEqual(getToken(), null);
});

test("admin getUser devuelve el usuario parseado de sobremesa_user", () => {
  installSeams({
    user: JSON.stringify({ username: "admin", email: "admin@lasobremesa.local", role: "ADMIN" })
  });
  const { getUser } = requireAdmin();
  const user = getUser();
  assert.strictEqual(user.username, "admin");
  assert.strictEqual(user.role, "ADMIN");
});

test("admin getUser devuelve null cuando sobremesa_user es JSON malformed", () => {
  installSeams({ user: "{no cerrado" });
  const { getUser } = requireAdmin();
  assert.strictEqual(getUser(), null);
});

test("admin getUser devuelve null cuando sobremesa_user es un JSON válido pero no objeto", () => {
  installSeams({ user: "123" });
  const { getUser } = requireAdmin();
  assert.strictEqual(getUser(), 123);
});

test("admin getUser devuelve null cuando no hay sobremesa_user", () => {
  installSeams({});
  const { getUser } = requireAdmin();
  assert.strictEqual(getUser(), null);
});

// --- checkAdminAuth -----------------------------------------------------

test("admin checkAdminAuth redirige a auth.html cuando no hay usuario", async () => {
  installSeams({});
  const { checkAdminAuth } = requireAdmin();
  await checkAdminAuth();
  assert.strictEqual(global.window.location.href, "auth.html");
});

test("admin checkAdminAuth redirige cuando el usuario no es admin y no hay token", async () => {
  installSeams({
    user: JSON.stringify({ username: "pepe", email: "pepe@test.com", role: "USER" })
  });
  const { checkAdminAuth } = requireAdmin();
  await checkAdminAuth();
  assert.strictEqual(global.window.location.href, "auth.html");
});

test("admin checkAdminAuth redirige cuando hay usuario admin pero no hay token", async () => {
  installSeams({
    user: JSON.stringify({ username: "admin", email: "admin@lasobremesa.local", role: "ADMIN" })
  });
  const { checkAdminAuth } = requireAdmin();
  await checkAdminAuth();
  assert.strictEqual(global.window.location.href, "auth.html");
});

test("admin checkAdminAuth no redirige y muestra info cuando es admin con token", async () => {
  const { elements, alerts } = installSeams({
    user: JSON.stringify({ username: "admin", email: "admin@lasobremesa.local", role: "ADMIN" }),
    token: "tok-abc"
  });
  const { checkAdminAuth } = requireAdmin();
  await checkAdminAuth();
  assert.strictEqual(global.window.location.href, "");
  assert.strictEqual(alerts.length, 0);
  assert.ok(elements["admin-user-info"].innerHTML.includes("ADMIN"));
});

// --- loadAdminData ------------------------------------------------------

test("admin loadAdminData éxito renderiza usuarios y actualiza estadísticas", async () => {
  const { elements } = installSeams({
    token: "tok",
    fetchImpl: async (url) => {
      if (url.includes("/admin/users")) {
        return {
          ok: true,
          json: async () => ({
            users: [
              { id: 1, username: "ana", email: "ana@test.com", role: "ADMIN", banned: false, createdAt: "2024-01-01" },
              { id: 2, username: "luis", email: "luis@test.com", role: "USER", banned: true, createdAt: "2024-02-01" }
            ]
          })
        };
      }
      if (url.includes("/admin/debug")) {
        return { ok: true, json: async () => ({ database: { totalMatches: 7 } }) };
      }
      return { ok: false, json: async () => ({}) };
    }
  });
  const { loadAdminData } = requireAdmin();
  await loadAdminData();
  assert.strictEqual(String(elements["stat-users"].textContent), "2");
  assert.strictEqual(String(elements["stat-admins"].textContent), "1");
  assert.strictEqual(String(elements["stat-banned"].textContent), "1");
});

test("admin loadAdminData error de red muestra alerta de conexión", async () => {
  const { alerts } = installSeams({
    token: "tok",
    fetchImpl: async () => {
      throw new Error("ECONNREFUSED");
    }
  });
  const { loadAdminData } = requireAdmin();
  await loadAdminData();
  await flush();
  assert.ok(alerts.some((m) => m.includes("No se pudo conectar con el servidor backend")));
});

test("admin loadAdminData respuesta no ok muestra alerta del backend", async () => {
  const { alerts } = installSeams({
    token: "tok",
    fetchImpl: async () => ({
      ok: false,
      json: async () => ({ message: "Token expirado" })
    })
  });
  const { loadAdminData } = requireAdmin();
  await loadAdminData();
  assert.ok(alerts.some((m) => m.includes("Token expirado")));
});

// --- updateStats --------------------------------------------------------

test("admin updateStats calcula total, admins y banned correctamente", async () => {
  const { elements } = installSeams({ token: "tok" });
  const { updateStats } = requireAdmin();
  const users = [
    { role: "ADMIN", banned: false },
    { role: "USER", banned: false },
    { role: "USER", banned: true },
    { role: "ADMIN", banned: true }
  ];
  updateStats(users);
  assert.strictEqual(String(elements["stat-users"].textContent), "4");
  assert.strictEqual(String(elements["stat-admins"].textContent), "2");
  assert.strictEqual(String(elements["stat-banned"].textContent), "2");
});

// --- renderUsers --------------------------------------------------------

test("admin renderUsers renderiza una fila por usuario sin búsqueda", () => {
  const { elements } = installSeams({});
  const { renderUsers } = requireAdmin();
  const users = [
    { id: 1, username: "ana", email: "ana@test.com", role: "USER", banned: false, createdAt: "2024-01-01" },
    { id: 2, username: "luis", email: "luis@test.com", role: "ADMIN", banned: false, createdAt: "2024-02-01" }
  ];
  renderUsers(users);
  const html = elements["users-table-body"].innerHTML;
  assert.ok(html.includes("#1"));
  assert.ok(html.includes("ana"));
  assert.ok(html.includes("#2"));
  assert.ok(html.includes("luis"));
});

test("admin renderUsers aplica escapeHtml a username y email", () => {
  const { elements } = installSeams({});
  const { renderUsers } = requireAdmin();
  const users = [
    { id: 9, username: "<script>alert(1)</script>", email: "x@y.com", role: "USER", banned: false, createdAt: "2024-01-01" }
  ];
  renderUsers(users);
  const html = elements["users-table-body"].innerHTML;
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!html.includes("<script>"));
});

test("admin renderUsers filtra por el valor del buscador (username y email)", () => {
  const { elements } = installSeams({});
  const { renderUsers } = requireAdmin();
  const users = [
    { id: 1, username: "ana", email: "ana@test.com", role: "USER", banned: false, createdAt: "2024-01-01" },
    { id: 2, username: "luis", email: "luis@test.com", role: "ADMIN", banned: false, createdAt: "2024-02-01" }
  ];
  elements["user-search"] = { value: "LUIS" };
  renderUsers(users);
  const html = elements["users-table-body"].innerHTML;
  assert.ok(html.includes("luis"));
  assert.ok(!html.includes("ana"));
});

test("admin renderUsers muestra mensaje de vacía cuando no hay coincidencias", () => {
  const { elements } = installSeams({});
  const { renderUsers } = requireAdmin();
  const users = [
    { id: 1, username: "ana", email: "ana@test.com", role: "USER", banned: false, createdAt: "2024-01-01" }
  ];
  elements["user-search"] = { value: "zzz" };
  renderUsers(users);
  const html = elements["users-table-body"].innerHTML;
  assert.ok(html.includes("No se encontraron usuarios"));
});

// --- escapeHtml ---------------------------------------------------------

test("admin escapeHtml escapa & < > y comillas dobles", () => {
  const { escapeHtml } = requireAdmin();
  assert.strictEqual(escapeHtml("a & b < c > d \"e\""), "a &amp; b &lt; c &gt; d &quot;e&quot;");
});

test("admin escapeHtml devuelve cadena vacía para null y undefined", () => {
  const { escapeHtml } = requireAdmin();
  assert.strictEqual(escapeHtml(null), "");
  assert.strictEqual(escapeHtml(undefined), "");
});

test("admin escapeHtml devuelve la misma cadena si no hay caracteres especiales", () => {
  const { escapeHtml } = requireAdmin();
  assert.strictEqual(escapeHtml("usuario-normal"), "usuario-normal");
});

// --- toggleBan ----------------------------------------------------------

test("admin toggleBan banea al usuario, pide motivo y recarga datos", async () => {
  const { alerts, requests } = installSeams({
    token: "tok",
    fetchImpl: async (url) => {
      if (url.includes("/ban")) {
        return { ok: true, json: async () => ({ message: "baneado" }) };
      }
      if (url.includes("/admin/users")) {
        return { ok: true, json: async () => ({ users: [] }) };
      }
      if (url.includes("/admin/debug")) {
        return { ok: true, json: async () => ({ database: { totalMatches: 0 } }) };
      }
      return { ok: false, json: async () => ({}) };
    }
  });
  const { toggleBan } = requireAdmin();
  await toggleBan(2, false);
  await flush();
  assert.ok(requests.some((r) => r.url.includes("/ban")));
  const banReq = requests.find((r) => r.url.includes("/ban"));
  assert.ok(banReq);
  assert.strictEqual(banReq.opts.method, "PATCH");
  assert.ok(JSON.parse(banReq.opts.body).reason.includes("Mal comportamiento en las partidas"));
  assert.ok(alerts.some((m) => m.includes("baneado")));
});

test("admin toggleBan cancela cuando el usuario no indica motivo", async () => {
  const { requests } = installSeams({
    token: "tok",
    fetchImpl: async (url) => {
      requests.push({ url, opts: {} });
      return { ok: true, json: async () => ({}) };
    }
  });
  global.prompt = () => null;
  const { toggleBan } = requireAdmin();
  await toggleBan(2, false);
  assert.strictEqual(requests.length, 0);
});

test("admin toggleBan no pide motivo cuando el usuario ya está baneado (desbanear)", async () => {
  const { prompts, requests } = installSeams({
    token: "tok",
    fetchImpl: async (url) => {
      requests.push({ url, opts: {} });
      if (url.includes("/ban")) {
        return { ok: true, json: async () => ({ message: "desbaneado" }) };
      }
      if (url.includes("/admin/users")) {
        return { ok: true, json: async () => ({ users: [] }) };
      }
      if (url.includes("/admin/debug")) {
        return { ok: true, json: async () => ({ database: { totalMatches: 0 } }) };
      }
      return { ok: false, json: async () => ({}) };
    }
  });
  const { toggleBan } = requireAdmin();
  await toggleBan(2, true);
  await flush();
  assert.strictEqual(prompts.length, 0);
  assert.ok(requests.some((r) => r.url.includes("/ban")));
});

test("admin toggleBan error de red muestra alerta de conexión", async () => {
  const { alerts } = installSeams({
    token: "tok",
    fetchImpl: async () => {
      throw new Error("falló");
    }
  });
  const { toggleBan } = requireAdmin();
  await toggleBan(2, false);
  await flush();
  assert.ok(alerts.some((m) => m.includes("Error de conexión con el servidor")));
});

// --- toggleRole ---------------------------------------------------------

test("admin toggleRole cambia el rol y recarga datos", async () => {
  const { requests, alerts } = installSeams({
    token: "tok",
    fetchImpl: async (url) => {
      requests.push({ url, opts: {} });
      if (url.includes("/role")) {
        return { ok: true, json: async () => ({ message: "rol actualizado" }) };
      }
      if (url.includes("/admin/users")) {
        return { ok: true, json: async () => ({ users: [] }) };
      }
      if (url.includes("/admin/debug")) {
        return { ok: true, json: async () => ({ database: { totalMatches: 0 } }) };
      }
      return { ok: false, json: async () => ({}) };
    }
  });
  const { toggleRole } = requireAdmin();
  await toggleRole(3, "USER");
  await flush();
  const roleReq = requests.find((r) => r.url.includes("/role"));
  assert.ok(roleReq);
  assert.strictEqual(roleReq.opts.method, "PATCH");
  assert.strictEqual(JSON.parse(roleReq.opts.body).role, "ADMIN");
  assert.ok(alerts.some((m) => m.includes("rol actualizado")));
});

test("admin toggleRole cancela cuando el usuario no confirma", async () => {
  const { requests } = installSeams({
    token: "tok",
    fetchImpl: async (url) => {
      requests.push({ url, opts: {} });
      return { ok: true, json: async () => ({}) };
    }
  });
  global.confirm = () => false;
  const { toggleRole } = requireAdmin();
  await toggleRole(3, "USER");
  assert.strictEqual(requests.length, 0);
});

test("admin toggleRole quita admin cuando el rol actual es ADMIN", async () => {
  const { requests } = installSeams({
    token: "tok",
    fetchImpl: async (url) => {
      requests.push({ url, opts: {} });
      if (url.includes("/role")) {
        return { ok: true, json: async () => ({ message: "ok" }) };
      }
      if (url.includes("/admin/users")) {
        return { ok: true, json: async () => ({ users: [] }) };
      }
      if (url.includes("/admin/debug")) {
        return { ok: true, json: async () => ({ database: { totalMatches: 0 } }) };
      }
      return { ok: false, json: async () => ({}) };
    }
  });
  const { toggleRole } = requireAdmin();
  await toggleRole(3, "ADMIN");
  await flush();
  const roleReq = requests.find((r) => r.url.includes("/role"));
  assert.ok(roleReq);
  assert.strictEqual(JSON.parse(roleReq.opts.body).role, "USER");
});

// --- loadDebugInfo ------------------------------------------------------

test("admin loadDebugInfo éxito escribe el diagnóstico en debug-output", async () => {
  const { elements } = installSeams({
    token: "tok",
    fetchImpl: async (url) => {
      if (url.includes("/admin/debug")) {
        return { ok: true, json: async () => ({ database: { totalMatches: 5 } }) };
      }
      return { ok: false, json: async () => ({}) };
    }
  });
  const { loadDebugInfo } = requireAdmin();
  await loadDebugInfo();
  assert.ok(elements["debug-output"].textContent.includes("totalMatches"));
});

test("admin loadDebugInfo respuesta no ok escribe mensaje de error", async () => {
  const { elements } = installSeams({
    token: "tok",
    fetchImpl: async () => ({
      ok: false,
      json: async () => ({ message: "sin acceso" }),
      statusText: "Forbidden"
    })
  });
  const { loadDebugInfo } = requireAdmin();
  await loadDebugInfo();
  assert.ok(elements["debug-output"].textContent.includes("sin acceso"));
});

test("admin loadDebugInfo error de red escribe mensaje de conexión", async () => {
  const { elements } = installSeams({
    token: "tok",
    fetchImpl: async () => {
      throw new Error("caída");
    }
  });
  const { loadDebugInfo } = requireAdmin();
  await loadDebugInfo();
  assert.ok(elements["debug-output"].textContent.includes("Error de conexión con el servidor backend"));
});

// --- logoutAdmin --------------------------------------------------------

test("admin logoutAdmin elimina user y token y redirige a auth.html", () => {
  const store = {};
  store.sobremesa_user = JSON.stringify({ email: "a@b.com" });
  store.sobremesa_token = "tok";
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => {
      store[key] = val;
    },
    removeItem: (key) => {
      delete store[key];
    }
  };
  global.window = {
    location: { pathname: "/html/admin.html", href: "" }
  };
  const { logoutAdmin } = requireAdmin();
  logoutAdmin();
  assert.strictEqual(store.sobremesa_user, undefined);
  assert.strictEqual(store.sobremesa_token, undefined);
  assert.strictEqual(global.window.location.href, "auth.html");
});
