import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    register(dto: RegisterDto): Promise<{
        message: string;
        access_token: string;
        user: {
            id: number;
            username: string;
            email: string;
            role: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        message: string;
        access_token: string;
        user: {
            id: number;
            username: string;
            email: string;
            role: string;
        };
    }>;
    signToken(userId: number, email: string, role: string): Promise<string>;
}
