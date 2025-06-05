import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum, MaxLength, IsUUID } from 'class-validator';
import { Ranks } from '../../common/enums/ranks.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  minecraft_uuid?: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(70)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pfp_url?: string;
  
  @IsOptional()
  @IsString()
  @MaxLength(100)
  banner_url?: string;

  @IsOptional()
  @IsEnum(Ranks)
  rank?: Ranks = Ranks.DEFAULT;
  
  @IsOptional()
  @IsString()
  @MaxLength(100)
  skin_url?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string; 

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;
}