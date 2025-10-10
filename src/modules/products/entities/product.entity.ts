import { BaseEntity } from 'src/common/entities/base.entity';
import { Category } from 'src/modules/categories/entities/category.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ProductStatus } from '../enums/product.status.enum';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ nullable: true, length: 100 })
  productCode?: string; // Mã sản phẩm

  @Column({ length: 200 })
  productName: string; // Tên sản phẩm

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category; // Danh mục sản phẩm

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  price?: number; // Giá

  @Column({ type: 'text', nullable: true })
  description?: string; // Mô tả chi tiết sản phẩm

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  productStatus: ProductStatus; // Trạng thái sản phẩm
}
