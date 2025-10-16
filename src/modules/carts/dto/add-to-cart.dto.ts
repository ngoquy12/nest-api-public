import { IsInt, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    description: 'ID của sản phẩm',
    example: 1,
    type: 'number',
  })
  @IsInt({ message: 'ID sản phẩm phải là số nguyên' })
  @IsPositive({ message: 'ID sản phẩm phải là số dương' })
  productId: number;

  @ApiProperty({
    description: 'Số lượng sản phẩm muốn thêm vào giỏ hàng',
    example: 2,
    type: 'number',
    minimum: 1,
  })
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity: number;
}
