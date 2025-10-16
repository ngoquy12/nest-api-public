import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import { BaseResponse } from 'src/common/responses/base-response';
import { CartResponse, CartItemResponse } from './interfaces/cart.interface';
import { formatMoneyByUnit } from 'src/common/utils/formatData';
import { Image } from '../images/entities/image.entity';
import { TypeImage } from 'src/common/enums/type-image.enum';
import { CartCacheService } from './services/cart-cache.service';

@Injectable()
export class CartsService {
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
    private readonly dataSource: DataSource,
    private readonly cartCacheService: CartCacheService,
  ) {}

  // Tìm hoặc tạo giỏ hàng cho user
  private async findOrCreateCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['cartItems', 'cartItems.product'],
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

  // Cập nhật tổng tiền và số lượng trong giỏ hàng
  private async updateCartTotals(cartId: number): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const cartItems = await this.cartItemRepository.find({
          where: { cart: { id: cartId } },
        });

        const totalAmount = cartItems.reduce(
          (sum, item) => sum + Number(item.totalPrice),
          0,
        );
        const totalItems = cartItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );

        // Sử dụng optimistic locking để tránh deadlock
        const cart = await this.cartRepository.findOne({
          where: { id: cartId },
        });

        if (cart) {
          cart.totalAmount = totalAmount;
          cart.totalItems = totalItems;
          await this.cartRepository.save(cart);
        }

        break; // Thành công, thoát khỏi vòng lặp
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new BadRequestException(
            'Cập nhật giỏ hàng thất bại. Vui lòng thử lại.',
          );
        }
        // Chờ một chút trước khi thử lại
        await new Promise((resolve) => setTimeout(resolve, 100 * retryCount));
      }
    }
  }

  // Lấy thông tin sản phẩm với ảnh
  private async getProductWithImage(productId: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId, deletedAt: null },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const image = await this.imageRepository.findOne({
      where: { refId: productId, type: TypeImage.PRODUCT },
    });

    return { product, image };
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
      productImage: productImage,
    };
  }

  // Mapping CartResponse
  private async mapCartResponse(cart: Cart): Promise<CartResponse> {
    const cartItemsResponse: CartItemResponse[] = [];

    for (const cartItem of cart.cartItems) {
      const { image } = await this.getProductWithImage(cartItem.product.id);
      cartItemsResponse.push(this.mapCartItemResponse(cartItem, image?.url));
    }

    return {
      id: cart.id,
      userId: cart.user.id,
      totalAmount: Number(cart.totalAmount),
      totalAmountFull: formatMoneyByUnit(cart.totalAmount),
      totalItems: cart.totalItems,
      cartItems: cartItemsResponse,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  // Thêm sản phẩm vào giỏ hàng
  async addToCart(
    user: JwtPayloadUser,
    addToCartDto: AddToCartDto,
  ): Promise<BaseResponse<CartResponse>> {
    const { productId, quantity } = addToCartDto;

    // Tạo idempotency key dựa trên request data
    const requestHash = this.cartCacheService.generateRequestHash({
      productId,
      quantity,
      userId: user.id,
    });

    const operationKey = this.cartCacheService.generateIdempotencyKey(
      user.id,
      'addToCart',
      requestHash,
    );

    // Kiểm tra request đã được xử lý chưa
    const isNewRequest =
      await this.cartCacheService.checkAndSetIdempotency(operationKey);

    if (!isNewRequest) {
      // Request đã được xử lý trước đó, trả về kết quả từ cache
      const cachedResult = await this.cartCacheService.getCachedCartResult(
        user.id,
        'addToCart',
      );

      if (cachedResult) {
        return new BaseResponse(
          HttpStatus.OK,
          'Thêm sản phẩm vào giỏ hàng thành công (từ cache)',
          cachedResult,
        );
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Set transaction timeout để tránh lock timeout
    await queryRunner.query('SET SESSION innodb_lock_wait_timeout = 10');

    try {
      // Kiểm tra sản phẩm tồn tại
      const { product } = await this.getProductWithImage(productId);

      if (!product.price) {
        throw new BadRequestException('Sản phẩm chưa có giá');
      }

      // Tìm hoặc tạo giỏ hàng
      const cart = await this.findOrCreateCart(user.id);

      // Kiểm tra sản phẩm đã có trong giỏ chưa
      const existingCartItem = await this.cartItemRepository.findOne({
        where: {
          cart: { id: cart.id },
          product: { id: productId },
        },
      });

      if (existingCartItem) {
        // Cập nhật số lượng
        existingCartItem.quantity += quantity;
        existingCartItem.totalPrice =
          existingCartItem.quantity * Number(existingCartItem.price);
        await queryRunner.manager.save(existingCartItem);
      } else {
        // Tạo mới cart item
        const newCartItem = this.cartItemRepository.create({
          cart,
          product,
          quantity,
          price: product.price,
          totalPrice: quantity * Number(product.price),
        });

        await queryRunner.manager.save(newCartItem);
      }

      // Cập nhật tổng tiền và số lượng giỏ hàng
      await this.updateCartTotals(cart.id);

      // Load lại cart với relations
      const updatedCart = await this.cartRepository.findOne({
        where: { id: cart.id },
        relations: ['cartItems', 'cartItems.product'],
      });

      const cartResponse = await this.mapCartResponse(updatedCart);

      await queryRunner.commitTransaction();

      // Cache kết quả
      await this.cartCacheService.cacheCartResult(
        user.id,
        'addToCart',
        cartResponse,
      );

      // Invalidate cache để đảm bảo data consistency
      await this.cartCacheService.invalidateCartCache(user.id);

      return new BaseResponse(
        HttpStatus.OK,
        'Thêm sản phẩm vào giỏ hàng thành công',
        cartResponse,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Thêm sản phẩm vào giỏ hàng thất bại');
    } finally {
      await queryRunner.release();
    }
  }

  // Lấy giỏ hàng của user
  async getCart(user: JwtPayloadUser): Promise<BaseResponse<CartResponse>> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: user.id } },
      relations: ['cartItems', 'cartItems.product'],
    });

    if (!cart) {
      // Tạo giỏ hàng mới nếu chưa có
      const newCart = await this.findOrCreateCart(user.id);
      const cartResponse = await this.mapCartResponse(newCart);
      return new BaseResponse(
        HttpStatus.OK,
        'Lấy giỏ hàng thành công',
        cartResponse,
      );
    }

    const cartResponse = await this.mapCartResponse(cart);
    return new BaseResponse(
      HttpStatus.OK,
      'Lấy giỏ hàng thành công',
      cartResponse,
    );
  }

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  async updateCartItem(
    user: JwtPayloadUser,
    cartItemId: number,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<BaseResponse<CartResponse>> {
    const { quantity } = updateCartItemDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Set transaction timeout để tránh lock timeout
    await queryRunner.query('SET SESSION innodb_lock_wait_timeout = 10');

    try {
      // Kiểm tra cart item thuộc về user
      const cartItem = await this.cartItemRepository.findOne({
        where: { id: cartItemId },
        relations: ['cart', 'cart.user'],
      });

      if (!cartItem || cartItem.cart.user.id !== user.id) {
        throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ hàng');
      }

      // Cập nhật số lượng
      cartItem.quantity = quantity;
      cartItem.totalPrice = quantity * Number(cartItem.price);
      await queryRunner.manager.save(cartItem);

      // Cập nhật tổng tiền và số lượng giỏ hàng
      await this.updateCartTotals(cartItem.cart.id);

      // Load lại cart với relations
      const updatedCart = await this.cartRepository.findOne({
        where: { id: cartItem.cart.id },
        relations: ['cartItems', 'cartItems.product'],
      });

      const cartResponse = await this.mapCartResponse(updatedCart);

      await queryRunner.commitTransaction();

      return new BaseResponse(
        HttpStatus.OK,
        'Cập nhật giỏ hàng thành công',
        cartResponse,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Cập nhật giỏ hàng thất bại');
    } finally {
      await queryRunner.release();
    }
  }

  // Xóa sản phẩm khỏi giỏ hàng
  async removeFromCart(
    user: JwtPayloadUser,
    cartItemId: number,
  ): Promise<BaseResponse<CartResponse>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Set transaction timeout để tránh lock timeout
    await queryRunner.query('SET SESSION innodb_lock_wait_timeout = 10');

    try {
      // Kiểm tra cart item thuộc về user
      const cartItem = await this.cartItemRepository.findOne({
        where: { id: cartItemId },
        relations: ['cart', 'cart.user'],
      });

      if (!cartItem || cartItem.cart.user.id !== user.id) {
        throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ hàng');
      }

      const cartId = cartItem.cart.id;

      // Xóa cart item
      await queryRunner.manager.delete(CartItem, cartItemId);

      // Cập nhật tổng tiền và số lượng giỏ hàng
      await this.updateCartTotals(cartId);

      // Load lại cart với relations
      const updatedCart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: ['cartItems', 'cartItems.product'],
      });

      const cartResponse = await this.mapCartResponse(updatedCart);

      await queryRunner.commitTransaction();

      return new BaseResponse(
        HttpStatus.OK,
        'Xóa sản phẩm khỏi giỏ hàng thành công',
        cartResponse,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Xóa sản phẩm khỏi giỏ hàng thất bại');
    } finally {
      await queryRunner.release();
    }
  }

  // Xóa toàn bộ giỏ hàng
  async clearCart(user: JwtPayloadUser): Promise<BaseResponse<null>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Set transaction timeout để tránh lock timeout
    await queryRunner.query('SET SESSION innodb_lock_wait_timeout = 10');

    try {
      const cart = await this.cartRepository.findOne({
        where: { user: { id: user.id } },
      });

      if (!cart) {
        return new BaseResponse(HttpStatus.OK, 'Giỏ hàng đã trống', null);
      }

      // Xóa tất cả cart items
      await queryRunner.manager.delete(CartItem, { cart: { id: cart.id } });

      // Cập nhật tổng tiền và số lượng về 0
      await queryRunner.manager.update(Cart, cart.id, {
        totalAmount: 0,
        totalItems: 0,
      });

      await queryRunner.commitTransaction();

      return new BaseResponse(
        HttpStatus.OK,
        'Xóa toàn bộ giỏ hàng thành công',
        null,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException('Xóa giỏ hàng thất bại');
    } finally {
      await queryRunner.release();
    }
  }
}
