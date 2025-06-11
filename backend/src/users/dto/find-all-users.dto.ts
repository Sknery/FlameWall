import { IsEnum, IsOptional, IsString } from 'class-validator';

export class FindAllUsersDto {
  @IsOptional()
  @IsEnum(['username', 'reputation_count', 'first_login'])
  sortBy?: 'username' | 'reputation_count' | 'first_login' = 'first_login';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  search?: string;
}