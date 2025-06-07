import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Great post! I totally agree.',
    description: 'The content of the comment',
    minLength: 1,
    maxLength: 1000,
  })
  @IsNotEmpty({ message: 'Comment content cannot be empty.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content: string;
}