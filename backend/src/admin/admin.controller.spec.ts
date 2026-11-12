import { test } from 'node:test';
import * as assert from 'node:assert';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AdminController } from './admin.controller';
import { ROLES_KEY } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const user = { id: 2, username: 'luis', role: 'USER', banned: false };

function makeController(overrides: Record<string, unknown> = {}) {
  const calls: Record<string, unknown[][]> = {};
  const track =
    (name: string, result: unknown) =>
    async (...args: unknown[]) => {
      (calls[name] ??= []).push(args);
      return result;
    };
  const service = {
    listUsers: track('listUsers', [user]),
    getUserById: track('getUserById', user),
    toggleBan: track('toggleBan', { ...user, banned: true }),
    setRole: track('setRole', { ...user, role: 'ADMIN' }),
    debugInfo: track('debugInfo', { status: 'ok', database: { totalUsers: 1 } }),
    ...overrides,
  };
  return { controller: new AdminController(service as never), calls };
}

test('AdminController está protegido por JWT y RolesGuard y exige rol ADMIN', () => {
  assert.deepStrictEqual(Reflect.getMetadata(GUARDS_METADATA, AdminController), [JwtAuthGuard, RolesGuard]);
  assert.deepStrictEqual(Reflect.getMetadata(ROLES_KEY, AdminController), ['ADMIN']);
});

test('listUsers devuelve los usuarios con mensaje', async () => {
  const { controller } = makeController();
  assert.deepStrictEqual(await controller.listUsers({}), {
    message: 'Usuarios listados correctamente',
    users: [user],
  });
});

test('getUser convierte el id a número', async () => {
  const { controller, calls } = makeController();
  const res = await controller.getUser('2');
  assert.deepStrictEqual(calls.getUserById[0], [2]);
  assert.deepStrictEqual(res, { message: 'Usuario encontrado', user });
});

test('toggleBan informa de que el usuario ha sido baneado', async () => {
  const { controller, calls } = makeController();
  const res = await controller.toggleBan('2', { reason: 'Spam' });
  assert.deepStrictEqual(calls.toggleBan[0], [2, 'Spam']);
  assert.strictEqual(res.message, 'Usuario baneado correctamente');
});

test('toggleBan informa de que el usuario ha sido desbaneado', async () => {
  const { controller } = makeController({ toggleBan: async () => ({ ...user, banned: false }) });
  const res = await controller.toggleBan('2', {});
  assert.strictEqual(res.message, 'Usuario desbaneado correctamente');
});

test('setRole actualiza el rol cuando es válido', async () => {
  const { controller, calls } = makeController();
  const res = await controller.setRole('2', { role: 'ADMIN' });
  assert.deepStrictEqual(calls.setRole[0], [2, 'ADMIN']);
  assert.strictEqual(res.message, 'Rol actualizado a ADMIN');
});

test('setRole rechaza un rol vacío o desconocido sin llamar al servicio', async () => {
  const { controller, calls } = makeController();
  for (const role of [undefined, 'ROOT']) {
    const res = await controller.setRole('2', { role: role as never });
    assert.deepStrictEqual(res, { message: 'Rol inválido. Debe ser USER o ADMIN.' });
  }
  assert.strictEqual(calls.setRole, undefined);
});

test('debug devuelve la información del servicio junto al mensaje', async () => {
  const { controller } = makeController();
  assert.deepStrictEqual(await controller.debug(), {
    message: 'Información de debug',
    status: 'ok',
    database: { totalUsers: 1 },
  });
});
