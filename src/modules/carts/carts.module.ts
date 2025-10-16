import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartsSimpleService } from './carts-simple.service';
import { CartsController } from './carts.controller';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Image } from '../images/entities/image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem, Product, User, Image])],
  controllers: [CartsController],
  providers: [CartsSimpleService],
  exports: [CartsSimpleService],
})
export class CartsModule {}
