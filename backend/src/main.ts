import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security Headers with Helmet
  app.use(helmet());

  // CORS: lista blanca de orígenes. FRONTEND_URL admite varios separados por comas.
  // Por defecto: Docker (8079) y Live Server (5500), tanto con localhost como con 127.0.0.1.
  const allowedOrigins = (
    process.env.FRONTEND_URL ||
    'http://localhost:8079,http://127.0.0.1:8079,http://localhost:5500,http://127.0.0.1:5500'
  )
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipe for security (whitelist, forbid non-whitelisted, transform)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap().catch((err) => {
  console.error('No se pudo arrancar el servidor:', err);
  process.exit(1);
});
