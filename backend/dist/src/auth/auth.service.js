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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const argon2 = require("argon2");
let AuthService = class AuthService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async register(dto) {
        const existingUser = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { username: dto.username }] },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('El correo o el nombre de usuario ya están en uso.');
        }
        const hashedPassword = await argon2.hash(dto.password, {
            type: argon2.argon2id,
            memoryCost: 2 ** 16,
            timeCost: 3,
            parallelism: 1,
        });
        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                password: hashedPassword,
            },
        });
        const token = await this.signToken(user.id, user.email, user.role);
        return {
            message: 'Usuario registrado con éxito',
            access_token: token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Credenciales inválidas.');
        }
        const isPasswordValid = await argon2.verify(user.password, dto.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Credenciales inválidas.');
        }
        const token = await this.signToken(user.id, user.email, user.role);
        return {
            message: 'Inicio de sesión exitoso',
            access_token: token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
        };
    }
    async signToken(userId, email, role) {
        const payload = {
            sub: userId,
            email,
            role,
        };
        return this.jwt.signAsync(payload, {
            expiresIn: '7d',
            secret: process.env.JWT_SECRET || 'super-secure-jwt-secret-key-la-sobremesa-2026',
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map