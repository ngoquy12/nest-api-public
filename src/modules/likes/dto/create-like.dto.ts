import { IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLikeDto {
  @ApiProperty({
    description: 'ID bài viết',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  articleId?: number;

  @ApiProperty({
    description: 'ID bình luận',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  commentId?: number;
}
