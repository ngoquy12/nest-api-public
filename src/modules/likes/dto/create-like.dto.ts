import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LikeType } from '../enums/like-type.enum';

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

  @ApiProperty({
    description: 'Loại like',
    enum: LikeType,
    example: LikeType.LIKE,
    required: false,
  })
  @IsEnum(LikeType)
  @IsOptional()
  type?: LikeType;
}
