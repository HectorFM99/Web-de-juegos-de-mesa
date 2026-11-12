import { test } from 'node:test';
import * as assert from 'node:assert';
import 'reflect-metadata';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { MatchesModule } from './matches/matches.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { RegisterDto, LoginDto } from './auth/dto/auth.dto';
import { CreateMatchDto } from './matches/dto/match.dto';

test('AppController devuelve el mensaje de bienvenida del servicio', () => {
  const controller = new AppController(new AppService());
  assert.match(controller.getHello(), /Bienvenido a la API de La Sobremesa/);
});

test('AppModule registra todos los módulos y el ThrottlerGuard global', () => {
  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AppModule);
  for (const mod of [PrismaModule, AuthModule, AdminModule, MatchesModule]) {
    assert.ok(imports.includes(mod));
  }
  const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AppModule);
  assert.ok(providers.some((p: any) => p.provide === APP_GUARD && p.useClass === ThrottlerGuard));
});

// Extrae la factoría de JwtModule.registerAsync de un módulo.
function jwtFactory(moduleClass: unknown) {
  const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, moduleClass);
  const jwtModule = imports.find((i: any) => i?.module?.name === 'JwtModule');
  const provider = jwtModule.providers.find((p: any) => typeof p.useFactory === 'function');
  return provider.useFactory;
}

for (const [name, moduleClass] of [
  ['AuthModule', AuthModule],
  ['AdminModule', AdminModule],
] as const) {
  test(`${name} configura JWT con JWT_SECRET o con el secreto por defecto`, async () => {
    const factory = jwtFactory(moduleClass);
    const withSecret = await factory({ get: () => 'secreto' });
    assert.deepStrictEqual(withSecret, { secret: 'secreto', signOptions: { expiresIn: '7d' } });
    const withoutSecret = await factory({ get: () => undefined });
    assert.strictEqual(withoutSecret.secret, 'super-secure-jwt-secret-key-la-sobremesa-2026');
  });
}

test('PrismaModule exporta PrismaService', () => {
  assert.deepStrictEqual(Reflect.getMetadata(MODULE_METADATA.EXPORTS, PrismaModule), [PrismaService]);
});

test('PrismaService conecta al iniciar el módulo', async () => {
  let connected = false;
  await PrismaService.prototype.onModuleInit.call({ $connect: async () => (connected = true) });
  assert.strictEqual(connected, true);
});

test('PrismaService cierra la app al recibir beforeExit', async () => {
  let handler: () => Promise<void>;
  let closed = false;
  const fakePrisma = { $on: (event: string, cb: () => Promise<void>) => event === 'beforeExit' && (handler = cb) };
  await PrismaService.prototype.enableShutdownHooks.call(fakePrisma, { close: async () => (closed = true) });
  await handler();
  assert.strictEqual(closed, true);
});

// --- DTOs -------------------------------------------------------------------

async function errorsFor(cls: any, plain: object) {
  const errors = await validate(plainToInstance(cls, plain));
  return errors.map((e) => e.property).sort();
}

test('RegisterDto valida usuario, email y contraseña de al menos 6 caracteres', async () => {
  assert.deepStrictEqual(await errorsFor(RegisterDto, { username: 'ana', email: 'ana@x.com', password: '123456' }), []);
  assert.deepStrictEqual(await errorsFor(RegisterDto, { username: '', email: 'no-email', password: '123' }), [
    'email',
    'password',
    'username',
  ]);
});

test('LoginDto exige un email válido y contraseña', async () => {
  assert.deepStrictEqual(await errorsFor(LoginDto, { email: 'ana@x.com', password: 'x' }), []);
  assert.deepStrictEqual(await errorsFor(LoginDto, { email: 'ana', password: '' }), ['email', 'password']);
});

test('CreateMatchDto valida tipos de juego, puntuación y victoria', async () => {
  assert.deepStrictEqual(await errorsFor(CreateMatchDto, { gameName: 'Damas', score: 3, winner: false }), []);
  assert.deepStrictEqual(await errorsFor(CreateMatchDto, { gameName: '', score: '3', winner: 'si' }), [
    'gameName',
    'score',
    'winner',
  ]);
});
