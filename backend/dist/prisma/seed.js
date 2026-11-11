"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = require("argon2");
const prisma = new client_1.PrismaClient();
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
    const existing = await prisma.$queryRawUnsafe(`SELECT id, role FROM users WHERE email = $1 OR username = $2 LIMIT 1`, adminEmail, adminUsername);
    if (existing.length > 0) {
        await prisma.$queryRawUnsafe(`UPDATE users SET role = 'ADMIN' WHERE id = $1`, existing[0].id);
        console.log('Usuario administrador existente actualizado con rol ADMIN (id:', existing[0].id, ')');
        return;
    }
    const result = await prisma.$queryRawUnsafe(`INSERT INTO users (username, email, password, role, banned, createdat)
     VALUES ($1, $2, $3, 'ADMIN', false, NOW())
     RETURNING id`, adminUsername, adminEmail, hashedPassword);
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
//# sourceMappingURL=seed.js.map