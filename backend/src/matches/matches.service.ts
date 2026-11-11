import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/match.dto';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateMatchDto) {
    return this.prisma.match.create({
      data: {
        gameName: dto.gameName,
        score: dto.score,
        winner: dto.winner,
        userId,
      },
    });
  }

  async findAllForUser(userId: number) {
    return this.prisma.match.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.match.findMany({
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
