import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArticleStatus } from '../enums/article-status.enum';
import { ArticleVisibility } from '../enums/article-visibility.enum';

export class SearchArticleDto {
  @ApiProperty({
    description: 'Từ khóa tìm kiếm',
    example: 'NestJS',
    required: false,
  })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({
    description: 'Trạng thái bài viết',
    enum: ArticleStatus,
    example: ArticleStatus.PUBLISHED,
    required: false,
  })
  @IsEnum(ArticleStatus)
  @IsOptional()
  status?: ArticleStatus;

  @ApiProperty({
    description: 'Mức độ hiển thị',
    enum: ArticleVisibility,
    example: ArticleVisibility.PUBLIC,
    required: false,
  })
  @IsEnum(ArticleVisibility)
  @IsOptional()
  visibility?: ArticleVisibility;

  @ApiProperty({
    description: 'ID danh mục bài viết',
    example: 1,
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({
    description: 'ID tác giả',
    example: 1,
    required: false,
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsOptional()
  authorId?: number;

  @ApiProperty({
    description: 'Danh sách tags',
    example: ['NestJS', 'Node.js'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

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
