import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ProductStatus } from '../enums/product.status.enum';

export class CreateProductDto {
  @ApiProperty({
    description: 'Mã sản phẩm (barcode)',
    example: '8934567890123',
    maxLength: 100,
  })
  @IsNotEmpty({
    message: 'Mã sản phẩm không được để trống',
  })
  @IsString({ message: 'Mã sản phẩm phải là chuỗi' })
  productCode?: string;

  @ApiProperty({
    description: 'Tên sản phẩm',
    example: 'Lốp xe Michelin',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @IsString({ message: 'Tên sản phẩm phải là chuỗi' })
  @MaxLength(200, {
    message: 'Tên sản phẩm không được vượt quá 200 ký tự',
  })
  productName: string;

  @ApiProperty({
    description: 'Giá sản phẩm (VND)',
    example: 100000,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'Giá sản phẩm không được để trống' })
  @IsNumber({}, { message: 'Giá sản phẩm phải là số' })
  price: number;

  @ApiProperty({
    description: 'Trạng thái sản phẩm',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  @IsNotEmpty({ message: 'Trạng thái sản phẩm không được để trống' })
  @IsEnum(ProductStatus, { message: 'Trạng thái sản phẩm không hợp lệ' })
  productStatus?: ProductStatus;

  @ApiProperty({
    description: 'Mô tả sản phẩm',
    example: 'Lốp xe chất lượng cao dùng cho xe tải.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Mô tả sản phẩm phải là chuỗi' })
  description?: string;

  @ApiProperty({
    description: 'ID danh mục sản phẩm',
    example: 1,
  })
  @IsNotEmpty({ message: 'ID danh mục sản phẩm không được để trống' })
  @IsNumber({}, { message: 'ID danh mục sản phẩm phải là số' })
  categoryId: number;

  @ApiProperty({
    description: 'Danh sách ảnh sản phẩm (file)',
    type: 'string',
    format: 'binary',
    isArray: true,
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
  })
  images: Express.Multer.File[];
}
