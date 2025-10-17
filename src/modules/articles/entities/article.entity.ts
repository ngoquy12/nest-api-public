import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('articles')
export class Article extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'longtext' })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'int' })
  categoryId: number;

  @Column({ type: 'int' })
  authorId: number;

  @ManyToOne('ArticleCategory', 'articles')
  @JoinColumn({ name: 'categoryId' })
  category: any;

  @ManyToOne('User', 'articles')
  @JoinColumn({ name: 'authorId' })
  author: any;

  @OneToMany('Comment', 'article')
  comments: any[];

  @OneToMany('Like', 'article')
  likes: any[];
}
