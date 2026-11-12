import { test } from 'node:test';
import * as assert from 'node:assert';
import 'reflect-metadata';
import { GUARDS_METADATA, HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { HttpStatus } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';

function makeController() {
  const calls: Record<string, unknown[]> = {};
  const service = {
    register: async (dto: unknown) => {
      calls.register = [dto];
      return { message: 'registrado' };
    },
    login: async (dto: unknown) => {
      calls.login = [dto];
      return { message: 'logueado' };
    },
  };
  return { controller: new AuthController(service as never), calls };
}

test('register delega en AuthService', async () => {
  const { controller, calls } = makeController();
  const dto = { username: 'ana', email: 'ana@x.com', password: 'secreta1' };
  assert.deepStrictEqual(await controller.register(dto), { message: 'registrado' });
  assert.deepStrictEqual(calls.register, [dto]);
});

test('login delega en AuthService y responde 200', async () => {
  const { controller, calls } = makeController();
  const dto = { email: 'ana@x.com', password: 'secreta1' };
  assert.deepStrictEqual(await controller.login(dto), { message: 'logueado' });
  assert.deepStrictEqual(calls.login, [dto]);
  assert.strictEqual(Reflect.getMetadata(HTTP_CODE_METADATA, AuthController.prototype.login), HttpStatus.OK);
});

test('getMe devuelve el usuario autenticado y está protegido por JWT', () => {
  const { controller } = makeController();
  const user = { id: 1, email: 'ana@x.com' };
  assert.deepStrictEqual(controller.getMe({ user }), {
    message: 'Token válido y acceso autorizado',
    user,
  });
  assert.deepStrictEqual(Reflect.getMetadata(GUARDS_METADATA, AuthController.prototype.getMe), [JwtAuthGuard]);
});
