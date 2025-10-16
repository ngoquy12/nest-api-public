import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommentStatus } from '../enums/comment-status.enum';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Nội dung bình luận',
    example: 'Bài viết rất hay và hữu ích!',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
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

  @ApiProperty({
    description: 'Trạng thái bình luận',
    enum: CommentStatus,
    example: CommentStatus.PENDING,
    required: false,
  })
  @IsEnum(CommentStatus)
  @IsOptional()
  status?: CommentStatus;
}
