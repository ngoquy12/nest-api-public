import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Image } from '../images/entities/image.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import { BaseResponse } from 'src/common/responses/base-response';
import { CartResponse, CartItemResponse } from './interfaces/cart.interface';
import { TypeImage } from 'src/common/enums/type-image.enum';
import { formatMoneyByUnit } from 'src/common/utils/formatData';

@Injectable()
export class CartsSimpleService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
  ) {}

  // Lấy hoặc tạo giỏ hàng
  private async getOrCreateCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!cart) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }

      cart = this.cartRepository.create({
        user,
        totalAmount: 0,
        totalItems: 0,
      });

      cart = await this.cartRepository.save(cart);
    }

    return cart;
  }

  // Lấy thông tin sản phẩm với ảnh
  private async getProductWithImage(productId: number) {
    console.log('🔍 Looking for product with ID:', productId);
    const product = await this.productRepository.findOne({
      where: { id: productId, deletedAt: null },
      relations: ['category'],
    });

    console.log('🔍 Found product:', product);

    if (!product) {
      throw new NotFoundException(
        `Không tìm thấy sản phẩm với ID: ${productId}`,
      );
    }

    const image = await this.imageRepository.findOne({
      where: { refId: productId, type: TypeImage.PRODUCT },
    });

    return { product, image };
  }

  // Cập nhật tổng tiền và số lượng trong giỏ hàng
  private async updateCartTotals(cartId: number): Promise<void> {
    const cartItems = await this.cartItemRepository.find({
      where: { cart: { id: cartId } },
    });

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0,
    );
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    await this.cartRepository.update(cartId, {
      totalAmount,
      totalItems,
    });
  }

  // Mapping CartItemResponse
  private mapCartItemResponse(
    cartItem: CartItem,
    productImage?: string,
  ): CartItemResponse {
    return {
      id: cartItem.id,
      productId: cartItem.product.id,
      productName: cartItem.product.productName,
      productCode: cartItem.product.productCode,
      price: Number(cartItem.price),
      priceFull: formatMoneyByUnit(cartItem.price),
      quantity: cartItem.quantity,
      totalPrice: Number(cartItem.totalPrice),
      totalPriceFull: formatMoneyByUnit(cartItem.totalPrice),
      productImage,
    };
  }

  // Mapping CartResponse
  private async mapCartResponse(cart: Cart): Promise<CartResponse> {
    const cartItemsResponse: CartItemResponse[] = [];

    for (const cartItem of cart.cartItems) {
      // Skip or clean up orphan items whose product no longer exists
      if (!cartItem.product) {
        try {
          await this.cartItemRepository.delete({ id: cartItem.id });
        } catch (_) {
          // ignore cleanup errors; just skip the item
        }
        continue;
      }
      const { image } = await this.getProductWithImage(cartItem.product.id);
      cartItemsResponse.push(this.mapCartItemResponse(cartItem, image?.url));
    }

    return {
      id: cart.id,
      userId: cart.user?.id || 0,
      totalAmount: Number(cart.totalAmount),
      totalAmountFull: formatMoneyByUnit(cart.totalAmount),
      totalItems: cart.totalItems,
      cartItems: cartItemsResponse,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  // Thêm sản phẩm vào giỏ hàng - Đơn giản
  async addToCart(
    user: JwtPayloadUser,
    addToCartDto: AddToCartDto,
  ): Promise<BaseResponse<CartResponse>> {
    const { productId, quantity } = addToCartDto;

    console.log('🔍 Debug addToCart:', {
      user: user,
      productId,
      quantity,
      userId: user.sub || user.id,
    });

    try {
      // Lấy hoặc tạo giỏ hàng
      const cart = await this.getOrCreateCart(user.sub || user.id);

      // Lấy thông tin sản phẩm
      const { product } = await this.getProductWithImage(productId);

      // Kiểm tra sản phẩm đã có trong giỏ chưa
      const existingCartItem = await this.cartItemRepository.findOne({
        where: {
          cart: { id: cart.id },
          product: { id: productId },
        },
      });

      console.log('🔍 Existing cart item:', existingCartItem);

      if (existingCartItem) {
        // Cập nhật số lượng
        const oldQuantity = existingCartItem.quantity;
        existingCartItem.quantity += quantity;
        existingCartItem.totalPrice =
          existingCartItem.quantity * Number(existingCartItem.price);

        console.log('🔍 Updating quantity:', {
          oldQuantity,
          addQuantity: quantity,
          newQuantity: existingCartItem.quantity,
        });

        await this.cartItemRepository.save(existingCartItem);
      } else {
        // Tạo mới cart item
        const newCartItem = this.cartItemRepository.create({
          cart,
          product,
          quantity,
          price: product.price,
          totalPrice: quantity * Number(product.price),
        });

        console.log('🔍 Creating new cart item:', {
          productId,
          quantity,
          price: product.price,
          totalPrice: quantity * Number(product.price),
        });

        await this.cartItemRepository.save(newCartItem);
      }

      // Cập nhật tổng tiền và số lượng giỏ hàng
      await this.updateCartTotals(cart.id);

      // Load lại cart với relations
      const updatedCart = await this.cartRepository.findOne({
        where: { id: cart.id },
        relations: ['user', 'cartItems', 'cartItems.product'],
      });

      const cartResponse = await this.mapCartResponse(updatedCart);

      return new BaseResponse(
        HttpStatus.OK,
        'Thêm sản phẩm vào giỏ hàng thành công',
        cartResponse,
      );
    } catch (error) {
      console.error('❌ Error in addToCart:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        `Thêm sản phẩm vào giỏ hàng thất bại: ${error.message}`,
      );
    }
  }

  // Lấy giỏ hàng
  async getCart(user: JwtPayloadUser): Promise<BaseResponse<CartResponse>> {
    try {
      const cart = await this.cartRepository.findOne({
        where: { user: { id: user.sub || user.id } },
        relations: ['user', 'cartItems', 'cartItems.product'],
      });

      if (!cart) {
        return new BaseResponse(HttpStatus.OK, 'Giỏ hàng trống', {
          id: 0,
          userId: user.sub || user.id,
          totalAmount: 0,
          totalAmountFull: '0 VNĐ',
          totalItems: 0,
          cartItems: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const cartResponse = await this.mapCartResponse(cart);

      return new BaseResponse(
        HttpStatus.OK,
        'Lấy giỏ hàng thành công',
        cartResponse,
      );
    } catch (error) {
      throw new BadRequestException('Lấy giỏ hàng thất bại');
    }
  }

  // Cập nhật số lượng sản phẩm
  async updateCartItem(
    user: JwtPayloadUser,
    cartItemId: number,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<BaseResponse<CartResponse>> {
    const { quantity } = updateCartItemDto;

    try {
      const cartItem = await this.cartItemRepository.findOne({
        where: { id: cartItemId },
        relations: ['cart', 'cart.user'],
      });

      if (!cartItem) {
        throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ hàng');
      }

      if (cartItem.cart.user.id !== (user.sub || user.id)) {
        throw new BadRequestException('Không có quyền cập nhật giỏ hàng này');
      }

      cartItem.quantity = quantity;
      cartItem.totalPrice = quantity * Number(cartItem.price);
      await this.cartItemRepository.save(cartItem);

      // Cập nhật tổng tiền và số lượng giỏ hàng
      await this.updateCartTotals(cartItem.cart.id);

      // Load lại cart với relations
      const updatedCart = await this.cartRepository.findOne({
        where: { id: cartItem.cart.id },
        relations: ['user', 'cartItems', 'cartItems.product'],
      });

      const cartResponse = await this.mapCartResponse(updatedCart);

      return new BaseResponse(
        HttpStatus.OK,
        'Cập nhật giỏ hàng thành công',
        cartResponse,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Cập nhật giỏ hàng thất bại');
    }
  }

  // Xóa sản phẩm khỏi giỏ hàng
  async removeCartItem(
    user: JwtPayloadUser,
    cartItemId: number,
  ): Promise<BaseResponse<CartResponse>> {
    try {
      const cartItem = await this.cartItemRepository.findOne({
        where: { id: cartItemId },
        relations: ['cart', 'cart.user'],
      });

      if (!cartItem) {
        throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ hàng');
      }

      if (cartItem.cart.user.id !== (user.sub || user.id)) {
        throw new BadRequestException('Không có quyền xóa sản phẩm này');
      }

      const cartId = cartItem.cart.id;
      await this.cartItemRepository.remove(cartItem);

      // Cập nhật tổng tiền và số lượng giỏ hàng
      await this.updateCartTotals(cartId);

      // Load lại cart với relations
      const updatedCart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: ['user', 'cartItems', 'cartItems.product'],
      });

      // Kiểm tra xem giỏ hàng còn sản phẩm nào không
      if (
        !updatedCart ||
        !updatedCart.cartItems ||
        updatedCart.cartItems.length === 0
      ) {
        return new BaseResponse(HttpStatus.OK, 'Giỏ hàng của bạn đang trống', {
          id: cartId,
          userId: user.sub || user.id,
          totalAmount: 0,
          totalAmountFull: '0 VNĐ',
          totalItems: 0,
          cartItems: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const cartResponse = await this.mapCartResponse(updatedCart);

      return new BaseResponse(
        HttpStatus.OK,
        'Xóa sản phẩm khỏi giỏ hàng thành công',
        cartResponse,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Xóa sản phẩm khỏi giỏ hàng thất bại');
    }
  }

  // Xóa toàn bộ giỏ hàng
  async clearCart(user: JwtPayloadUser): Promise<BaseResponse<any>> {
    try {
      const cart = await this.cartRepository.findOne({
        where: { user: { id: user.sub || user.id } },
        relations: ['cartItems'],
      });

      if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
        return new BaseResponse(HttpStatus.OK, 'Giỏ hàng của bạn đang trống', {
          id: cart?.id || 0,
          userId: user.sub || user.id,
          totalAmount: 0,
          totalAmountFull: '0 VNĐ',
          totalItems: 0,
          cartItems: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await this.cartItemRepository.delete({ cart: { id: cart.id } });
      await this.updateCartTotals(cart.id);

      return new BaseResponse(
        HttpStatus.OK,
        'Xóa toàn bộ giỏ hàng thành công',
        {
          id: cart.id,
          userId: user.sub || user.id,
          totalAmount: 0,
          totalAmountFull: '0 VNĐ',
          totalItems: 0,
          cartItems: [],
          createdAt: cart.createdAt,
          updatedAt: new Date(),
        },
      );
    } catch (error) {
      throw new BadRequestException('Xóa giỏ hàng thất bại');
    }
  }
}
