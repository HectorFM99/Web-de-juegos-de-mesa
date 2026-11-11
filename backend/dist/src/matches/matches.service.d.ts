import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/match.dto';
export declare class MatchesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: number, dto: CreateMatchDto): Promise<{
        gameName: string;
        score: number;
        winner: boolean;
        createdAt: Date;
        id: number;
        userId: number;
    }>;
    findAllForUser(userId: number): Promise<{
        gameName: string;
        score: number;
        winner: boolean;
        createdAt: Date;
        id: number;
        userId: number;
    }[]>;
    findAll(): Promise<({
        user: {
            id: number;
            username: string;
            email: string;
        };
    } & {
        gameName: string;
        score: number;
        winner: boolean;
        createdAt: Date;
        id: number;
        userId: number;
    })[]>;
}
