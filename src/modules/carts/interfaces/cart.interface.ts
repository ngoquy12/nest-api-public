import { ApiProperty } from '@nestjs/swagger';

export class CartItemResponse {
  @ApiProperty({ description: 'ID của cart item', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID của sản phẩm', example: 1 })
  productId: number;

  @ApiProperty({ description: 'Tên sản phẩm', example: 'iPhone 15' })
  productName: string;

  @ApiProperty({ description: 'Mã sản phẩm', example: 'PR123456' })
  productCode: string;

  @ApiProperty({ description: 'Giá sản phẩm', example: 250000 })
  price: number;

  @ApiProperty({
    description: 'Giá sản phẩm (định dạng)',
    example: '250.000 VNĐ',
  })
  priceFull: string;

  @ApiProperty({ description: 'Số lượng', example: 2 })
  quantity: number;

  @ApiProperty({ description: 'Tổng tiền', example: 500000 })
  totalPrice: number;

  @ApiProperty({ description: 'Tổng tiền (định dạng)', example: '500.000 VNĐ' })
  totalPriceFull: string;

  @ApiProperty({
    description: 'Ảnh sản phẩm',
    example: 'https://res.cloudinary.com/...',
    required: false,
  })
  productImage?: string;
}

export class CartResponse {
  @ApiProperty({ description: 'ID của giỏ hàng', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID của user', example: 1 })
  userId: number;

  @ApiProperty({ description: 'Tổng tiền trong giỏ hàng', example: 750000 })
  totalAmount: number;

  @ApiProperty({ description: 'Tổng tiền (định dạng)', example: '750.000 VNĐ' })
  totalAmountFull: string;

  @ApiProperty({ description: 'Tổng số sản phẩm', example: 3 })
  totalItems: number;

  @ApiProperty({
    description: 'Danh sách sản phẩm trong giỏ hàng',
    type: [CartItemResponse],
  })
  cartItems: CartItemResponse[];

  @ApiProperty({
    description: 'Thời gian tạo',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
