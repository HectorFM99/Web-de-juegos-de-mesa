import { test } from 'node:test';
import * as assert from 'node:assert';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

type FakeApp = {
  middlewares: unknown[];
  cors: any;
  pipes: unknown[];
  port: unknown;
};

// Carga main.ts con NestFactory.create sustituido por una app falsa y espera al arranque.
async function bootWith(env: Record<string, string | undefined>): Promise<FakeApp> {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
  }
  const state: FakeApp = { middlewares: [], cors: null, pipes: [], port: null };
  let started: () => void;
  const listening = new Promise<void>((resolve) => (started = resolve));
  const fakeApp = {
    use: (mw: unknown) => state.middlewares.push(mw),
    enableCors: (opts: unknown) => (state.cors = opts),
    useGlobalPipes: (...pipes: unknown[]) => state.pipes.push(...pipes),
    listen: async (port: unknown) => {
      state.port = port;
    },
    getUrl: async () => {
      started();
      return 'http://localhost';
    },
  };
  const originalCreate = NestFactory.create;
  const originalLog = console.log;
  (NestFactory as any).create = async () => fakeApp;
  console.log = () => {};
  try {
    delete require.cache[require.resolve('./main')];
    require('./main');
    await listening;
  } finally {
    (NestFactory as any).create = originalCreate;
    console.log = originalLog;
    process.env = saved;
  }
  return state;
}

test('main arranca con helmet, CORS por defecto, validación global y puerto 3000', async () => {
  const app = await bootWith({ FRONTEND_URL: undefined, PORT: undefined });
  assert.strictEqual(app.middlewares.length, 1);
  assert.deepStrictEqual(app.cors.origin, [
    'http://localhost:8079',
    'http://127.0.0.1:8079',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ]);
  assert.strictEqual(app.cors.credentials, true);
  assert.strictEqual(app.pipes.length, 1);
  assert.ok(app.pipes[0] instanceof ValidationPipe);
  assert.strictEqual(app.port, 3000);
});

test('main usa FRONTEND_URL (separada por comas) y PORT si están definidas', async () => {
  const app = await bootWith({ FRONTEND_URL: 'https://a.com, https://b.com', PORT: '4000' });
  assert.deepStrictEqual(app.cors.origin, ['https://a.com', 'https://b.com']);
  assert.strictEqual(app.port, '4000');
});
