import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMatchDto {
  @IsString()
  @IsNotEmpty()
  gameName: string;

  @IsNumber()
  score: number;

  @IsBoolean()
  winner: boolean;
}
