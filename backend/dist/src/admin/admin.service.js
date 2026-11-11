"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    toSafeUser(user) {
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
    async listUsers() {
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
    async getUserById(id) {
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
            throw new common_1.NotFoundException('Usuario no encontrado.');
        }
        return this.toSafeUser(user);
    }
    async toggleBan(id, reason) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado.');
        }
        if (user.role === 'ADMIN') {
            throw new common_1.BadRequestException('No se puede banear a otro administrador.');
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
    async setRole(id, role) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado.');
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
    async debugInfo() {
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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map