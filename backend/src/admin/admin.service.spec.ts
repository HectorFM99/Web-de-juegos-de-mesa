import { test } from 'node:test';
import * as assert from 'node:assert';
import * as argon2 from 'argon2';
import { AdminService } from './admin.service';

type FakeUser = { id: number; username: string; email: string; password: string; role: string };

function makePrisma(initial: FakeUser[] = [], opts: { failFind?: boolean } = {}) {
  const users = [...initial];
  const calls = { update: [] as unknown[], create: [] as unknown[] };
  const prisma = {
    user: {
      findFirst: async ({ where }: { where: { OR: Array<Partial<FakeUser>> } }) => {
        if (opts.failFind) {
          throw new Error('DB caída');
        }
        return (
          users.find((u) =>
            where.OR.some((cond) => (cond.email && u.email === cond.email) || (cond.username && u.username === cond.username)),
          ) ?? null
        );
      },
      update: async (args: { where: { id: number }; data: Partial<FakeUser> }) => {
        calls.update.push(args);
        const user = users.find((u) => u.id === args.where.id);
        Object.assign(user, args.data);
        return user;
      },
      create: async (args: { data: Omit<FakeUser, 'id'> }) => {
        calls.create.push(args);
        const user = { id: users.length + 1, ...args.data };
        users.push(user);
        return user;
      },
    },
  };
  return { prisma, users, calls };
}

function makeService(prisma: unknown) {
  return new AdminService(prisma as never);
}

test('ensureAdminUser promueve a ADMIN un usuario admin existente con rol USER', async () => {
  const { prisma, users, calls } = makePrisma([
    { id: 1, username: 'admin', email: 'admin@lasobremesa.local', password: 'x', role: 'USER' },
  ]);
  await makeService(prisma).ensureAdminUser();
  assert.strictEqual(users[0].role, 'ADMIN');
  assert.strictEqual(calls.update.length, 1);
  assert.strictEqual(calls.create.length, 0);
});

test('ensureAdminUser no toca nada si el admin ya tiene rol ADMIN', async () => {
  const { prisma, calls } = makePrisma([
    { id: 1, username: 'admin', email: 'admin@lasobremesa.local', password: 'x', role: 'ADMIN' },
  ]);
  await makeService(prisma).ensureAdminUser();
  assert.strictEqual(calls.update.length, 0);
  assert.strictEqual(calls.create.length, 0);
});

test('ensureAdminUser crea el admin con contraseña hasheada si no existe', async () => {
  const { prisma, users } = makePrisma();
  await makeService(prisma).ensureAdminUser();
  assert.strictEqual(users.length, 1);
  assert.strictEqual(users[0].role, 'ADMIN');
  assert.strictEqual(users[0].email, process.env.ADMIN_EMAIL || 'admin@lasobremesa.local');
  assert.notStrictEqual(users[0].password, 'Admin1234!');
  assert.ok(await argon2.verify(users[0].password, process.env.ADMIN_PASSWORD || 'Admin1234!'));
});

test('onModuleInit no lanza aunque falle la base de datos', async () => {
  const { prisma } = makePrisma([], { failFind: true });
  const service = makeService(prisma);
  // Silencia el log de error esperado
  (service as unknown as { logger: { error: () => void } }).logger.error = () => {};
  await assert.doesNotReject(() => service.onModuleInit());
});
