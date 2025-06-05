import { IsNotEmpty, IsString, IsOptional, IsInt, MinLength, MaxLength } from 'class-validator';

export class CreateNewsDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  desc: string;

  @IsOptional()
  @IsInt()
  author_id?: number; 
}