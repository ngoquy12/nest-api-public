import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { CategoryStatus } from '../enums/category-status.enum';
import { Type } from 'class-transformer';

export class SearchCategoryDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm (theo tên danh mục hoặc mô tả)',
    example: 'Hoa quả',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Trang hiện tại', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  currentPage?: number;

  @ApiPropertyOptional({
    description: 'Số lượng bản trên mỗi trang',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;

  @ApiPropertyOptional({
    enum: CategoryStatus,
    description: 'Trạng thái danh mục',
    example: CategoryStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CategoryStatus)
  categoryStatus?: CategoryStatus;
}
