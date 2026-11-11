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
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    private toSafeUser;
    listUsers(): Promise<SafeUser[]>;
    getUserById(id: number): Promise<SafeUser>;
    toggleBan(id: number, reason?: string): Promise<SafeUser>;
    setRole(id: number, role: 'USER' | 'ADMIN'): Promise<SafeUser>;
    debugInfo(): Promise<Record<string, unknown>>;
}
