import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
