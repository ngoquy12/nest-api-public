import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CategoryStatus } from '../enums/category-status.enum';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Tên danh mục',
    example: 'Hoa quả',
  })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống.' })
  @MaxLength(100, {
    message: 'Tên danh mục không được vượt quá 100 ký tự.',
  })
  @IsString({ message: 'Tên danh mục phải là một chuỗi.' })
  categoryName: string;

  @ApiProperty({
    description: 'Trạng thái danh mục (ACTIVE, INACTIVE)',
    enum: CategoryStatus,
    example: CategoryStatus.ACTIVE,
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống.' })
  @IsEnum(CategoryStatus, {
    message: 'Trạng thái không hợp lệ. Chỉ chấp nhận ACTIVE hoặc INACTIVE.',
  })
  categoryStatus: CategoryStatus;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết danh mục',
    example: 'Danh mục dành cho các dịch vụ bảo dưỡng định kỳ.',
  })
  @IsOptional()
  @IsString({ message: 'Mô tả danh mục phải là một chuỗi.' })
  categoryDescription?: string;
}
