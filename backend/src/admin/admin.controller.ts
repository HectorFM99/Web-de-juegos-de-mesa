import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { AdminService } from './admin.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  async listUsers(@Req() req: any) {
    const users = await this.adminService.listUsers();
    return { message: 'Usuarios listados correctamente', users };
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    const user = await this.adminService.getUserById(Number(id));
    return { message: 'Usuario encontrado', user };
  }

  @Patch('users/:id/ban')
  async toggleBan(@Param('id') id: string, @Body() body: { reason?: string }) {
    const user = await this.adminService.toggleBan(Number(id), body.reason);
    return {
      message: user.banned ? 'Usuario baneado correctamente' : 'Usuario desbaneado correctamente',
      user,
    };
  }

  @Patch('users/:id/role')
  async setRole(@Param('id') id: string, @Body() body: { role: 'USER' | 'ADMIN' }) {
    if (!body.role || !['USER', 'ADMIN'].includes(body.role)) {
      return { message: 'Rol inválido. Debe ser USER o ADMIN.' };
    }
    const user = await this.adminService.setRole(Number(id), body.role);
    return { message: `Rol actualizado a ${user.role}`, user };
  }

  @Get('debug')
  async debug() {
    const info = await this.adminService.debugInfo();
    return { message: 'Información de debug', ...info };
  }
}
