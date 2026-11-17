import { test } from 'node:test';
import * as assert from 'node:assert';
import helmet from 'helmet';
import { helmetOptions, permissionsPolicy, PERMISSIONS_POLICY } from './security';

// Respuesta falsa que solo guarda las cabeceras que establecen los middlewares.
function fakeResponse() {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader: (name: string, value: string) => (headers[name.toLowerCase()] = value),
    removeHeader: (name: string) => delete headers[name.toLowerCase()],
  };
}

test('helmet aplica las cabeceras de seguridad configuradas', async () => {
  const res = fakeResponse();
  await new Promise<void>((resolve, reject) =>
    helmet(helmetOptions)({} as any, res as any, (err?: unknown) => (err ? reject(err) : resolve())),
  );
  const h = res.headers;
  assert.strictEqual(
    h['content-security-policy'],
    "default-src 'none';base-uri 'none';form-action 'none';frame-ancestors 'none';object-src 'none'",
  );
  assert.strictEqual(h['x-frame-options'], 'DENY');
  assert.strictEqual(h['strict-transport-security'], 'max-age=31536000; includeSubDomains; preload');
  assert.strictEqual(h['referrer-policy'], 'strict-origin-when-cross-origin');
  assert.strictEqual(h['x-content-type-options'], 'nosniff');
  assert.strictEqual(h['x-xss-protection'], '0');
  assert.strictEqual(h['cross-origin-opener-policy'], 'same-origin');
  assert.strictEqual(h['cross-origin-resource-policy'], 'same-origin');
  assert.strictEqual(h['x-permitted-cross-domain-policies'], 'none');
});

test('permissionsPolicy añade Permissions-Policy y continúa la cadena', () => {
  const res = fakeResponse();
  let called = false;
  permissionsPolicy({} as any, res as any, () => (called = true));
  assert.strictEqual(res.headers['permissions-policy'], PERMISSIONS_POLICY);
  assert.ok(called);
});
