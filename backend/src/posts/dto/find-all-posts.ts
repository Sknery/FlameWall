import { IsEnum, IsOptional, IsString } from 'class-validator';

export class FindAllPostsDto {
  @IsOptional()
  @IsEnum(['created_at', 'score']) // score - это будет наш расчетный рейтинг поста
  sortBy?: 'created_at' | 'score' = 'created_at';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  search?: string;
}