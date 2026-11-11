import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    validate(payload: {
        sub: number;
        email: string;
        role?: string;
    }): Promise<{
        id: number;
        username: string;
        email: string;
        role: string;
        banned: boolean;
        bannedAt: Date | null;
        bannedReason: string | null;
        createdAt: Date;
    }>;
}
export {};
