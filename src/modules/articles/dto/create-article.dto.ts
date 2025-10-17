import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Tiêu đề bài viết',
    example: 'Hướng dẫn lập trình React Native',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Nội dung bài viết',
    example: 'Nội dung chi tiết của bài viết...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Đường dẫn hình ảnh đại diện (URL)',
    example: 'https://example.com/article-image.jpg',
    required: false,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'Đường dẫn hình ảnh phải là URL hợp lệ' })
  @MaxLength(500)
  image?: string;

  @ApiProperty({
    description: 'ID danh mục bài viết',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;
}
