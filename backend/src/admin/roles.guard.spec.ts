import { test } from 'node:test';
import * as assert from 'node:assert';
import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Roles, ROLES_KEY } from './roles.decorator';

class Protected {
  @Roles('ADMIN')
  adminOnly() {}

  open() {}
}

function contextFor(handler: Function, user?: { role: string }) {
  return {
    getHandler: () => handler,
    getClass: () => Protected,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as never;
}

const guard = new RolesGuard(new Reflector());

test('Roles guarda los roles requeridos como metadatos', () => {
  assert.deepStrictEqual(Reflect.getMetadata(ROLES_KEY, Protected.prototype.adminOnly), ['ADMIN']);
});

test('RolesGuard deja pasar si la ruta no exige roles', () => {
  assert.strictEqual(guard.canActivate(contextFor(Protected.prototype.open)), true);
});

test('RolesGuard deja pasar a un usuario con el rol requerido', () => {
  assert.strictEqual(guard.canActivate(contextFor(Protected.prototype.adminOnly, { role: 'ADMIN' })), true);
});

test('RolesGuard rechaza a un usuario sin el rol requerido', () => {
  assert.throws(
    () => guard.canActivate(contextFor(Protected.prototype.adminOnly, { role: 'USER' })),
    ForbiddenException,
  );
});

test('RolesGuard rechaza una petición sin usuario autenticado', () => {
  assert.throws(() => guard.canActivate(contextFor(Protected.prototype.adminOnly)), ForbiddenException);
});
