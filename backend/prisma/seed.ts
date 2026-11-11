import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lasobremesa.local';
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin1234!';

  const hashedPassword = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  // Check if exists
  const existing = await prisma.$queryRawUnsafe<Array<{ id: number; role: string }>>(
    `SELECT id, role FROM users WHERE email = $1 OR username = $2 LIMIT 1`,
    adminEmail,
    adminUsername,
  );

  if (existing.length > 0) {
    // Update to ADMIN role
    await prisma.$queryRawUnsafe(
      `UPDATE users SET role = 'ADMIN' WHERE id = $1`,
      existing[0].id,
    );
    console.log('Usuario administrador existente actualizado con rol ADMIN (id:', existing[0].id, ')');
    return;
  }

  const result = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
    `INSERT INTO users (username, email, password, role, banned, createdat)
     VALUES ($1, $2, $3, 'ADMIN', false, NOW())
     RETURNING id`,
    adminUsername,
    adminEmail,
    hashedPassword,
  );

  console.log('Usuario administrador creado con éxito:');
  console.log('  Usuario:', adminUsername);
  console.log('  Email:', adminEmail);
  console.log('  Contraseña:', adminPassword);
  console.log('  Rol: ADMIN');
  console.log('  ID:', result[0].id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
