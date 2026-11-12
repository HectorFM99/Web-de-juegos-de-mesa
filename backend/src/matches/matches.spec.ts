import { test } from 'node:test';
import * as assert from 'node:assert';
import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../admin/roles.guard';
import { ROLES_KEY } from '../admin/roles.decorator';

function makePrisma() {
  const calls: Record<string, unknown[]> = {};
  const prisma = {
    match: {
      create: async (args: unknown) => {
        calls.create = [args];
        return { id: 1 };
      },
      findMany: async (args: unknown) => {
        (calls.findMany ??= []).push(args);
        return [{ id: 1 }];
      },
    },
  };
  return { prisma, calls };
}

const dto = { gameName: 'Ajedrez', score: 10, winner: true };

test('MatchesService.create guarda la partida asociada al usuario', async () => {
  const { prisma, calls } = makePrisma();
  const match = await new MatchesService(prisma as never).create(4, dto);
  assert.deepStrictEqual(match, { id: 1 });
  assert.deepStrictEqual(calls.create, [{ data: { ...dto, userId: 4 } }]);
});

test('MatchesService.findAllForUser filtra por usuario y ordena por fecha', async () => {
  const { prisma, calls } = makePrisma();
  await new MatchesService(prisma as never).findAllForUser(4);
  assert.deepStrictEqual(calls.findMany[0], { where: { userId: 4 }, orderBy: { createdAt: 'desc' } });
});

test('MatchesService.findAll incluye datos públicos del usuario', async () => {
  const { prisma, calls } = makePrisma();
  await new MatchesService(prisma as never).findAll();
  assert.deepStrictEqual(calls.findMany[0], {
    include: { user: { select: { id: true, username: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
});

function makeController() {
  const calls: Record<string, unknown[]> = {};
  const service = {
    create: async (...args: unknown[]) => {
      calls.create = args;
      return { id: 1 };
    },
    findAllForUser: async (...args: unknown[]) => {
      calls.findAllForUser = args;
      return [{ id: 1 }];
    },
    findAll: async () => [{ id: 1 }, { id: 2 }],
  };
  return { controller: new MatchesController(service as never), calls };
}

test('MatchesController.create usa el id del usuario autenticado', async () => {
  const { controller, calls } = makeController();
  const res = await controller.create({ user: { id: 4 } }, dto);
  assert.deepStrictEqual(calls.create, [4, dto]);
  assert.deepStrictEqual(res, { message: 'Partida registrada con éxito', match: { id: 1 } });
});

test('MatchesController.findAllForUser devuelve solo las partidas del usuario', async () => {
  const { controller, calls } = makeController();
  const res = await controller.findAllForUser({ user: { id: 4 } });
  assert.deepStrictEqual(calls.findAllForUser, [4]);
  assert.deepStrictEqual(res, { message: 'Partidas del usuario', matches: [{ id: 1 }] });
});

test('MatchesController.findAll devuelve todas las partidas y requiere rol ADMIN', async () => {
  const { controller } = makeController();
  const res = await controller.findAll();
  assert.strictEqual(res.matches.length, 2);
  assert.deepStrictEqual(Reflect.getMetadata(GUARDS_METADATA, MatchesController), [JwtAuthGuard]);
  assert.deepStrictEqual(Reflect.getMetadata(GUARDS_METADATA, MatchesController.prototype.findAll), [RolesGuard]);
  assert.deepStrictEqual(Reflect.getMetadata(ROLES_KEY, MatchesController.prototype.findAll), ['ADMIN']);
});
