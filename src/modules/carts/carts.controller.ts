import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CartsSimpleService } from './carts-simple.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import { BaseResponse } from 'src/common/responses/base-response';
import { CartResponse } from './interfaces/cart.interface';

@ApiTags('Giỏ hàng (Carts)')
@ApiBearerAuth()
@Controller({ version: '1' })
@UseGuards(JwtAuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsSimpleService) {}

  // Thêm sản phẩm vào giỏ hàng
  @Post('add')
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  @ApiBody({ type: AddToCartDto })
  @ApiResponse({
    status: 200,
    description: 'Thêm sản phẩm vào giỏ hàng thành công',
    type: BaseResponse<CartResponse>,
  })
  async addToCart(
    @CurrentUser() user: JwtPayloadUser,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<BaseResponse<CartResponse>> {
    return this.cartsService.addToCart(user, addToCartDto);
  }

  // Lấy giỏ hàng của user
  @Get()
  @ApiOperation({ summary: 'Lấy giỏ hàng của user' })
  @ApiResponse({
    status: 200,
    description: 'Lấy giỏ hàng thành công',
    type: BaseResponse<CartResponse>,
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  async getCart(
    @CurrentUser() user: JwtPayloadUser,
  ): Promise<BaseResponse<CartResponse>> {
    return this.cartsService.getCart(user);
  }

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  @Put('items/:cartItemId')
  @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm trong giỏ hàng' })
  @ApiParam({
    name: 'cartItemId',
    description: 'ID của cart item',
    type: 'number',
  })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật giỏ hàng thành công',
    type: BaseResponse<CartResponse>,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy sản phẩm trong giỏ hàng',
  })
  @ApiResponse({
    status: 429,
    description: 'Quá nhiều yêu cầu',
  })
  async updateCartItem(
    @CurrentUser() user: JwtPayloadUser,
    @Param('cartItemId', ParseIntPipe) cartItemId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<BaseResponse<CartResponse>> {
    return this.cartsService.updateCartItem(
      user,
      cartItemId,
      updateCartItemDto,
    );
  }

  // Xóa sản phẩm khỏi giỏ hàng
  @Delete('items/:cartItemId')
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi giỏ hàng' })
  @ApiParam({
    name: 'cartItemId',
    description: 'ID của cart item',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa sản phẩm khỏi giỏ hàng thành công',
    type: BaseResponse<CartResponse>,
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy sản phẩm trong giỏ hàng',
  })
  async removeFromCart(
    @CurrentUser() user: JwtPayloadUser,
    @Param('cartItemId', ParseIntPipe) cartItemId: number,
  ): Promise<BaseResponse<CartResponse>> {
    return this.cartsService.removeCartItem(user, cartItemId);
  }

  // Xóa toàn bộ giỏ hàng
  @Delete('clear')
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Xóa toàn bộ giỏ hàng thành công hoặc giỏ hàng đang trống',
    type: BaseResponse<any>,
  })
  @ApiResponse({
    status: 401,
    description: 'Không có quyền truy cập',
  })
  async clearCart(
    @CurrentUser() user: JwtPayloadUser,
  ): Promise<BaseResponse<any>> {
    return this.cartsService.clearCart(user);
  }
}
