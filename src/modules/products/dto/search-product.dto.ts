import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '../enums/product.status.enum';

export class SearchAndPagingProductDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm sản phẩm',
    example: 'Lốp xe Michelin',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Trang hiện tại (bắt đầu từ 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  currentPage?: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng sản phẩm trên mỗi trang',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number = 10;

  @ApiPropertyOptional({
    enum: ProductStatus,
    description: 'Lọc theo trạng thái sản phẩm',
    example: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Trạng thái sản phẩm không hợp lệ' })
  productStatus?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Lọc theo danh mục sản phẩm',
    example: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;
}
