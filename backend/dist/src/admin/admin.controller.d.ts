import { AdminService } from './admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    listUsers(req: any): Promise<{
        message: string;
        users: import("./admin.service").SafeUser[];
    }>;
    getUser(id: string): Promise<{
        message: string;
        user: import("./admin.service").SafeUser;
    }>;
    toggleBan(id: string, body: {
        reason?: string;
    }): Promise<{
        message: string;
        user: import("./admin.service").SafeUser;
    }>;
    setRole(id: string, body: {
        role: 'USER' | 'ADMIN';
    }): Promise<{
        message: string;
        user?: undefined;
    } | {
        message: string;
        user: import("./admin.service").SafeUser;
    }>;
    debug(): Promise<{
        message: string;
    }>;
}
