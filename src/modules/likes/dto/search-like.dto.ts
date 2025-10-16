import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { LikeType } from '../enums/like-type.enum';

export class SearchLikeDto {
  @ApiProperty({
    description: 'Loại like',
    enum: LikeType,
    example: LikeType.LIKE,
    required: false,
  })
  @IsEnum(LikeType)
  @IsOptional()
  type?: LikeType;

  @ApiProperty({
    description: 'ID bài viết',
    example: 1,
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  articleId?: number;

  @ApiProperty({
    description: 'ID bình luận',
    example: 1,
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  commentId?: number;

  @ApiProperty({
    description: 'ID người dùng',
    example: 1,
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiProperty({
    description: 'Trang hiện tại',
    example: 1,
    minimum: 1,
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  @Min(1)
  currentPage?: number = 1;

  @ApiProperty({
    description: 'Số bản ghi trên mỗi trang',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiProperty({
    description: 'Sắp xếp theo',
    example: 'createdAt',
    required: false,
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Thứ tự sắp xếp',
    example: 'DESC',
    required: false,
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
