import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('likes')
@Unique(['userId', 'articleId', 'commentId'])
export class Like extends BaseEntity {
  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int', nullable: true })
  articleId: number;

  @Column({ type: 'int', nullable: true })
  commentId: number;

  @Column({ type: 'varchar', length: 20, default: 'LIKE' })
  type: string;

  @ManyToOne('Article', 'likes')
  @JoinColumn({ name: 'article_id' })
  article: any;

  @ManyToOne('User', 'likes')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @ManyToOne('Comment', 'likes')
  @JoinColumn({ name: 'comment_id' })
  comment: any;
}
