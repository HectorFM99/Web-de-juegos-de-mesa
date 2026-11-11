import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });

    if (existingUser) {
      throw new BadRequestException('El correo o el nombre de usuario ya están en uso.');
    }

    const hashedPassword = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
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

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const isPasswordValid = await argon2.verify(user.password, dto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const token = await this.signToken(user.id, user.email, user.role);

    return {
      message: 'Inicio de sesión exitoso',
      access_token: token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    };
  }

  async signToken(userId: number, email: string, role: string): Promise<string> {
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
}
