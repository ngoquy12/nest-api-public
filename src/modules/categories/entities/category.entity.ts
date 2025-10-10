import { Column, Entity, OneToMany } from 'typeorm';
import { CategoryStatus } from '../enums/category-status.enum';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Product } from 'src/modules/products/entities/product.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @Column()
  categoryName: string;

  @Column({ nullable: true, type: 'longtext' })
  categoryDescription?: string;

  @Column({
    type: 'enum',
    enum: CategoryStatus,
    default: CategoryStatus.ACTIVE,
  })
  categoryStatus: CategoryStatus;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
