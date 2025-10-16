import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('articles')
export class Article extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  summary: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  featuredImage: string;

  @Column({ type: 'varchar', length: 50, default: 'DRAFT' })
  status: string;

  @Column({ type: 'varchar', length: 50, default: 'PUBLIC' })
  visibility: string;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'int' })
  categoryId: number;

  @Column({ type: 'int' })
  authorId: number;

  @ManyToOne('ArticleCategory', 'articles')
  @JoinColumn({ name: 'categoryId' })
  articleCategory: any;

  @ManyToOne('User', 'articles')
  @JoinColumn({ name: 'authorId' })
  author: any;

  @OneToMany('Comment', 'article')
  comments: any[];

  @OneToMany('Like', 'article')
  likes: any[];
}
