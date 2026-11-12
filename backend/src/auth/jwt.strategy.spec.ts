import { test } from 'node:test';
import * as assert from 'node:assert';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

function makeStrategy(user: Record<string, unknown> | null, secret?: string) {
  const config = { get: (key: string) => (key === 'JWT_SECRET' ? secret : undefined) };
  const prisma = { user: { findUnique: async () => user } };
  return new JwtStrategy(config as never, prisma as never);
}

test('validate devuelve el usuario sin la contraseña', async () => {
  const strategy = makeStrategy({ id: 1, email: 'a@x.com', role: 'USER', password: 'hash' });
  const result = await strategy.validate({ sub: 1, email: 'a@x.com' });
  assert.deepStrictEqual(result, { id: 1, email: 'a@x.com', role: 'USER' });
});

test('validate rechaza un token de un usuario que ya no existe', async () => {
  const strategy = makeStrategy(null, 'secreto-de-config');
  await assert.rejects(() => strategy.validate({ sub: 99, email: 'x@x.com' }), UnauthorizedException);
});

test('JwtAuthGuard usa la estrategia jwt', () => {
  const guard = new JwtAuthGuard();
  assert.strictEqual(typeof guard.canActivate, 'function');
});
