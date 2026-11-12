import { test } from 'node:test';
import * as assert from 'node:assert';
import * as argon2 from 'argon2';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

type StoredUser = { id: number; username: string; email: string; password: string; role: string };

const DEFAULT_SECRET = 'super-secure-jwt-secret-key-la-sobremesa-2026';

function makePrisma(users: StoredUser[] = []) {
  const created: unknown[] = [];
  const prisma = {
    user: {
      findFirst: async ({ where }: { where: { OR: Array<Partial<StoredUser>> } }) =>
        users.find((u) => where.OR.some((c) => u.email === c.email || u.username === c.username)) ?? null,
      findUnique: async ({ where }: { where: { email: string } }) =>
        users.find((u) => u.email === where.email) ?? null,
      create: async ({ data }: { data: Omit<StoredUser, 'id' | 'role'> }) => {
        created.push(data);
        const user = { id: users.length + 1, role: 'USER', ...data };
        users.push(user);
        return user;
      },
    },
  };
  return { prisma, users, created };
}

const jwt = new JwtService();

function makeService(prisma: unknown) {
  return new AuthService(prisma as never, jwt);
}

test('register crea el usuario con la contraseña hasheada y devuelve un token', async () => {
  const { prisma, users } = makePrisma();
  const res = await makeService(prisma).register({ username: 'ana', email: 'ana@x.com', password: 'secreta1' });
  assert.strictEqual(res.message, 'Usuario registrado con éxito');
  assert.deepStrictEqual(res.user, { id: 1, username: 'ana', email: 'ana@x.com', role: 'USER' });
  assert.notStrictEqual(users[0].password, 'secreta1');
  assert.ok(await argon2.verify(users[0].password, 'secreta1'));
  const payload = await jwt.verifyAsync(res.access_token, { secret: DEFAULT_SECRET });
  assert.strictEqual(payload.sub, 1);
  assert.strictEqual(payload.email, 'ana@x.com');
  assert.strictEqual(payload.role, 'USER');
});

test('register rechaza un email o usuario ya en uso', async () => {
  const { prisma, created } = makePrisma([
    { id: 1, username: 'ana', email: 'ana@x.com', password: 'h', role: 'USER' },
  ]);
  await assert.rejects(
    () => makeService(prisma).register({ username: 'otra', email: 'ana@x.com', password: 'secreta1' }),
    BadRequestException,
  );
  await assert.rejects(
    () => makeService(prisma).register({ username: 'ana', email: 'nueva@x.com', password: 'secreta1' }),
    BadRequestException,
  );
  assert.strictEqual(created.length, 0);
});

test('login con credenciales válidas devuelve token y datos públicos', async () => {
  const password = await argon2.hash('secreta1');
  const { prisma } = makePrisma([{ id: 5, username: 'jefe', email: 'jefe@x.com', password, role: 'ADMIN' }]);
  const res = await makeService(prisma).login({ email: 'jefe@x.com', password: 'secreta1' });
  assert.strictEqual(res.message, 'Inicio de sesión exitoso');
  assert.deepStrictEqual(res.user, { id: 5, username: 'jefe', email: 'jefe@x.com', role: 'ADMIN' });
  const payload = await jwt.verifyAsync(res.access_token, { secret: DEFAULT_SECRET });
  assert.strictEqual(payload.role, 'ADMIN');
});

test('login rechaza un email desconocido', async () => {
  const { prisma } = makePrisma();
  await assert.rejects(
    () => makeService(prisma).login({ email: 'nadie@x.com', password: 'x' }),
    UnauthorizedException,
  );
});

test('login rechaza una contraseña incorrecta', async () => {
  const password = await argon2.hash('secreta1');
  const { prisma } = makePrisma([{ id: 5, username: 'jefe', email: 'jefe@x.com', password, role: 'USER' }]);
  await assert.rejects(
    () => makeService(prisma).login({ email: 'jefe@x.com', password: 'mala' }),
    UnauthorizedException,
  );
});

test('signToken firma con JWT_SECRET cuando está definida', async () => {
  const saved = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'otro-secreto';
  try {
    const token = await makeService(makePrisma().prisma).signToken(3, 'a@x.com', 'USER');
    const payload = await jwt.verifyAsync(token, { secret: 'otro-secreto' });
    assert.strictEqual(payload.sub, 3);
    await assert.rejects(() => jwt.verifyAsync(token, { secret: DEFAULT_SECRET }));
  } finally {
    if (saved === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = saved;
  }
});
