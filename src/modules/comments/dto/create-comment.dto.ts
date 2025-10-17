import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Nội dung bình luận',
    example: 'Bài viết rất hay và hữu ích!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'ID bài viết',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  articleId: number;

  @ApiProperty({
    description: 'ID bình luận cha (để trả lời bình luận)',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  parentId?: number;
}
