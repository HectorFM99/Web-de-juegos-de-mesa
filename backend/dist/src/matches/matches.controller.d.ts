import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/match.dto';
export declare class MatchesController {
    private matchesService;
    constructor(matchesService: MatchesService);
    create(req: any, dto: CreateMatchDto): Promise<{
        message: string;
        match: {
            gameName: string;
            score: number;
            winner: boolean;
            createdAt: Date;
            id: number;
            userId: number;
        };
    }>;
    findAllForUser(req: any): Promise<{
        message: string;
        matches: {
            gameName: string;
            score: number;
            winner: boolean;
            createdAt: Date;
            id: number;
            userId: number;
        }[];
    }>;
    findAll(): Promise<{
        message: string;
        matches: ({
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
        })[];
    }>;
}
