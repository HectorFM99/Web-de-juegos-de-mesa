import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

export type SafeUser = {
  id: number;
  username: string;
  email: string;
  role: string;
  banned: boolean;
  bannedAt: Date | null;
  bannedReason: string | null;
  createdAt: Date;
};

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureAdminUser();
    } catch (err) {
      this.logger.error('No se pudo asegurar el usuario administrador', err as Error);
    }
  }

  // Garantiza que la cuenta administradora existe y tiene rol ADMIN
  // (equivalente a prisma/seed.ts, que no se ejecuta en Docker).
  async ensureAdminUser(): Promise<void> {
    const email = process.env.ADMIN_EMAIL || 'admin@lasobremesa.local';
    const username = process.env.ADMIN_USERNAME || 'admin';

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      if (existing.role !== 'ADMIN') {
        await this.prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } });
        this.logger.log(`Usuario administrador (id ${existing.id}) actualizado a rol ADMIN`);
      }
      return;
    }

    const password = await argon2.hash(process.env.ADMIN_PASSWORD || 'Admin1234!', {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });
    const created = await this.prisma.user.create({
      data: { username, email, password, role: 'ADMIN' },
    });
    this.logger.log(`Usuario administrador creado (id ${created.id}, email ${email})`);
  }

  private toSafeUser(user: any): SafeUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      banned: user.banned,
      bannedAt: user.bannedAt,
      bannedReason: user.bannedReason,
      createdAt: user.createdAt,
    };
  }

  async listUsers(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        banned: true,
        bannedAt: true,
        bannedReason: true,
        createdAt: true,
      },
    });
    return users.map((u) => this.toSafeUser(u));
  }

  async getUserById(id: number): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        banned: true,
        bannedAt: true,
        bannedReason: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return this.toSafeUser(user);
  }

  async toggleBan(id: number, reason?: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('No se puede banear a otro administrador.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        banned: !user.banned,
        bannedAt: !user.banned ? new Date() : null,
        bannedReason: !user.banned ? (reason ?? 'Sin motivo especificado') : null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        banned: true,
        bannedAt: true,
        bannedReason: true,
        createdAt: true,
      },
    });

    return this.toSafeUser(updated);
  }

  async setRole(id: number, role: 'USER' | 'ADMIN'): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        banned: true,
        bannedAt: true,
        bannedReason: true,
        createdAt: true,
      },
    });

    return this.toSafeUser(updated);
  }

  async debugInfo(): Promise<Record<string, unknown>> {
    const [totalUsers, totalAdmins, totalBanned, totalMatches] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { banned: true } }),
      this.prisma.match.count(),
    ]);

    return {
      server: 'La Sobremesa Backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        totalUsers,
        totalAdmins,
        totalBanned,
        totalMatches,
      },
    };
  }
}
