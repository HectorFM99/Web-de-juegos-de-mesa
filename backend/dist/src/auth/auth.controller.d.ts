import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    getMe(req: any): {
        message: string;
        user: any;
    };
}
