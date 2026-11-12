import { test } from 'node:test';
import * as assert from 'node:assert';
import * as argon2 from 'argon2';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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

// --- Gestión de usuarios -------------------------------------------------------

type DbUser = FakeUser & {
  banned: boolean;
  bannedAt: Date | null;
  bannedReason: string | null;
  createdAt: Date;
};

function dbUser(overrides: Partial<DbUser> = {}): DbUser {
  return {
    id: 2,
    username: 'luis',
    email: 'luis@x.com',
    password: 'hash-secreto',
    role: 'USER',
    banned: false,
    bannedAt: null,
    bannedReason: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

function makeUserPrisma(stored: DbUser | null) {
  const calls = { findMany: [] as any[], findUnique: [] as any[], update: [] as any[], count: [] as any[] };
  const prisma = {
    user: {
      findMany: async (args: unknown) => {
        calls.findMany.push(args);
        return stored ? [stored] : [];
      },
      findUnique: async (args: unknown) => {
        calls.findUnique.push(args);
        return stored;
      },
      update: async (args: { data: Partial<DbUser> }) => {
        calls.update.push(args);
        return { ...stored, ...args.data };
      },
      count: async (args?: { where?: Record<string, unknown> }) => {
        calls.count.push(args);
        if (!args) return 10;
        return args.where.role === 'ADMIN' ? 2 : 3;
      },
    },
    match: { count: async () => 7 },
  };
  return { prisma, calls };
}

const SAFE_KEYS = ['banned', 'bannedAt', 'bannedReason', 'createdAt', 'email', 'id', 'role', 'username'];

test('listUsers devuelve los usuarios sin contraseña, ordenados por fecha descendente', async () => {
  const { prisma, calls } = makeUserPrisma(dbUser());
  const users = await makeService(prisma).listUsers();
  assert.strictEqual(users.length, 1);
  assert.deepStrictEqual(Object.keys(users[0]).sort(), SAFE_KEYS);
  assert.deepStrictEqual(calls.findMany[0].orderBy, { createdAt: 'desc' });
  assert.strictEqual(calls.findMany[0].select.password, undefined);
});

test('getUserById devuelve el usuario sin contraseña', async () => {
  const { prisma, calls } = makeUserPrisma(dbUser());
  const user = await makeService(prisma).getUserById(2);
  assert.strictEqual(user.username, 'luis');
  assert.strictEqual((user as any).password, undefined);
  assert.deepStrictEqual(calls.findUnique[0].where, { id: 2 });
});

test('getUserById lanza NotFoundException si no existe', async () => {
  const { prisma } = makeUserPrisma(null);
  await assert.rejects(() => makeService(prisma).getUserById(99), NotFoundException);
});

test('toggleBan banea a un usuario activo con el motivo indicado', async () => {
  const { prisma, calls } = makeUserPrisma(dbUser());
  const user = await makeService(prisma).toggleBan(2, 'Spam');
  assert.strictEqual(user.banned, true);
  assert.strictEqual(user.bannedReason, 'Spam');
  assert.ok(user.bannedAt instanceof Date);
  assert.deepStrictEqual(calls.update[0].where, { id: 2 });
  assert.strictEqual((user as any).password, undefined);
});

test('toggleBan sin motivo usa "Sin motivo especificado"', async () => {
  const { prisma } = makeUserPrisma(dbUser());
  const user = await makeService(prisma).toggleBan(2);
  assert.strictEqual(user.bannedReason, 'Sin motivo especificado');
});

test('toggleBan desbanea a un usuario baneado y limpia fecha y motivo', async () => {
  const { prisma } = makeUserPrisma(dbUser({ banned: true, bannedAt: new Date(), bannedReason: 'Spam' }));
  const user = await makeService(prisma).toggleBan(2, 'ignorado');
  assert.strictEqual(user.banned, false);
  assert.strictEqual(user.bannedAt, null);
  assert.strictEqual(user.bannedReason, null);
});

test('toggleBan lanza NotFoundException si el usuario no existe', async () => {
  const { prisma } = makeUserPrisma(null);
  await assert.rejects(() => makeService(prisma).toggleBan(99), NotFoundException);
});

test('toggleBan no permite banear a un administrador', async () => {
  const { prisma, calls } = makeUserPrisma(dbUser({ role: 'ADMIN' }));
  await assert.rejects(() => makeService(prisma).toggleBan(2), BadRequestException);
  assert.strictEqual(calls.update.length, 0);
});

test('setRole cambia el rol del usuario', async () => {
  const { prisma, calls } = makeUserPrisma(dbUser());
  const user = await makeService(prisma).setRole(2, 'ADMIN');
  assert.strictEqual(user.role, 'ADMIN');
  assert.deepStrictEqual(calls.update[0].data, { role: 'ADMIN' });
});

test('setRole lanza NotFoundException si el usuario no existe', async () => {
  const { prisma } = makeUserPrisma(null);
  await assert.rejects(() => makeService(prisma).setRole(99, 'USER'), NotFoundException);
});

test('debugInfo resume el estado del servidor y los contadores de la base de datos', async () => {
  const { prisma } = makeUserPrisma(dbUser());
  const info = await makeService(prisma).debugInfo();
  assert.strictEqual(info.server, 'La Sobremesa Backend');
  assert.strictEqual(info.status, 'ok');
  assert.ok(!Number.isNaN(Date.parse(info.timestamp as string)));
  assert.deepStrictEqual(info.database, { totalUsers: 10, totalAdmins: 2, totalBanned: 3, totalMatches: 7 });
});

test('ensureAdminUser usa ADMIN_EMAIL, ADMIN_USERNAME y ADMIN_PASSWORD si están definidas', async () => {
  const saved = { ...process.env };
  process.env.ADMIN_EMAIL = 'jefe@x.com';
  process.env.ADMIN_USERNAME = 'jefe';
  process.env.ADMIN_PASSWORD = 'OtraClave1!';
  try {
    const { prisma, users } = makePrisma();
    await makeService(prisma).ensureAdminUser();
    assert.strictEqual(users[0].email, 'jefe@x.com');
    assert.strictEqual(users[0].username, 'jefe');
    assert.ok(await argon2.verify(users[0].password, 'OtraClave1!'));
  } finally {
    process.env = saved;
  }
});
