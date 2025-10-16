import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ArticleStatus } from '../enums/article-status.enum';
import { ArticleVisibility } from '../enums/article-visibility.enum';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Tiêu đề bài viết',
    example: 'Hướng dẫn lập trình NestJS từ A đến Z',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Tóm tắt bài viết',
    example:
      'Bài viết hướng dẫn chi tiết về cách xây dựng ứng dụng backend với NestJS',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  summary: string;

  @ApiProperty({
    description: 'Nội dung bài viết',
    example: '<p>Nội dung chi tiết của bài viết...</p>',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Slug bài viết (URL thân thiện)',
    example: 'huong-dan-lap-trinh-nestjs-tu-a-den-z',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  slug?: string;

  @ApiProperty({
    description: 'Hình ảnh đại diện',
    example: 'https://example.com/featured-image.jpg',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  featuredImage?: string;

  @ApiProperty({
    description: 'Trạng thái bài viết',
    enum: ArticleStatus,
    example: ArticleStatus.DRAFT,
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
    description: 'Danh sách tags',
    example: ['NestJS', 'Node.js', 'Backend', 'API'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'Thời gian xuất bản',
    example: '2024-01-15T10:30:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @ApiProperty({
    description: 'ID danh mục bài viết',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;
}
