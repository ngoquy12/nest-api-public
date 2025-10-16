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
import { ArticleCategoryStatus } from '../enums/article-category-status.enum';

export class SearchArticleCategoryDto {
  @ApiProperty({
    description: 'Từ khóa tìm kiếm',
    example: 'công nghệ',
    required: false,
  })
  @IsString()
  @IsOptional()
  keyword?: string;

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
}
