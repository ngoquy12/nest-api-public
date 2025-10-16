import { BaseEntity } from 'src/common/entities/base.entity';
import { Product } from 'src/modules/products/entities/product.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Cart } from './cart.entity';

@Entity('cart_items')
export class CartItem extends BaseEntity {
  @ManyToOne(() => Cart, (cart) => cart.cartItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart; // Giỏ hàng chứa sản phẩm này

  @ManyToOne(() => Product, (product) => product.cartItems)
  @JoinColumn({ name: 'product_id' })
  product: Product; // Sản phẩm trong giỏ hàng

  @Column({ type: 'int', default: 1 })
  quantity: number; // Số lượng sản phẩm

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number; // Giá sản phẩm tại thời điểm thêm vào giỏ

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number; // Tổng tiền = quantity * price
}
