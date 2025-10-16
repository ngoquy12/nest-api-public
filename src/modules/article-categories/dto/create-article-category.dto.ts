import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ArticleCategoryStatus } from '../enums/article-category-status.enum';

export class CreateArticleCategoryDto {
  @ApiProperty({
    description: 'Tên danh mục bài viết',
    example: 'Công nghệ',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  categoryName: string;

  @ApiProperty({
    description: 'Mô tả danh mục bài viết',
    example: 'Các bài viết về công nghệ, lập trình, phần mềm',
    required: false,
  })
  @IsString()
  @IsOptional()
  categoryDescription?: string;

  @ApiProperty({
    description: 'Trạng thái danh mục',
    enum: ArticleCategoryStatus,
    example: ArticleCategoryStatus.ACTIVE,
    required: false,
  })
  @IsEnum(ArticleCategoryStatus)
  @IsOptional()
  categoryStatus?: ArticleCategoryStatus;

  @ApiProperty({
    description: 'Slug danh mục (URL thân thiện)',
    example: 'cong-nghe',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  categorySlug?: string;

  @ApiProperty({
    description: 'Hình ảnh danh mục',
    example: 'https://example.com/category-image.jpg',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  categoryImage?: string;

  @ApiProperty({
    description: 'Thứ tự sắp xếp',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
