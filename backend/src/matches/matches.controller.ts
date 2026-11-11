import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/match.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../admin/roles.guard';
import { Roles } from '../admin/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateMatchDto) {
    const userId = req.user.id;
    const match = await this.matchesService.create(userId, dto);
    return { message: 'Partida registrada con éxito', match };
  }

  @Get()
  async findAllForUser(@Req() req: any) {
    const userId = req.user.id;
    const matches = await this.matchesService.findAllForUser(userId);
    return { message: 'Partidas del usuario', matches };
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('all')
  async findAll() {
    const matches = await this.matchesService.findAll();
    return { message: 'Todas las partidas del sistema', matches };
  }
}
