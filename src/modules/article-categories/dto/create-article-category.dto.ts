import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleCategoryDto {
  @ApiProperty({
    description: 'Tên danh mục bài viết',
    example: 'Công nghệ',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Mô tả danh mục bài viết',
    example: 'Các bài viết về công nghệ, lập trình, phần mềm',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Đường dẫn hình ảnh danh mục (URL)',
    example: 'https://example.com/category-image.jpg',
    required: false,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'Đường dẫn hình ảnh phải là URL hợp lệ' })
  @MaxLength(500)
  image?: string;
}
