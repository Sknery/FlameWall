import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Ranks } from '../../common/enums/ranks.enum';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEnum(Ranks)
  rank?: Ranks;

  @IsOptional()
  @IsInt()
  reputation_count?: number;
}