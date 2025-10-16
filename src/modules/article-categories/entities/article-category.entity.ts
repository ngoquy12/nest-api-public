import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('article_categories')
export class ArticleCategory extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  categoryName: string;

  @Column({ type: 'text', nullable: true })
  categoryDescription: string;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  categoryStatus: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  categorySlug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  categoryImage: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany('Article', 'articleCategory')
  articles: any[];
}
