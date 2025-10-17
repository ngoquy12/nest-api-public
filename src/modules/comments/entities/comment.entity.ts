import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('comments')
export class Comment extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', nullable: true })
  parentId: number;

  @Column({ type: 'int' })
  articleId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @ManyToOne('Article', 'comments')
  @JoinColumn({ name: 'articleId' })
  article: any;

  @ManyToOne('User', 'comments')
  @JoinColumn({ name: 'userId' })
  user: any;

  @ManyToOne('Comment', 'replies')
  @JoinColumn({ name: 'parentId' })
  parent: any;

  @OneToMany('Comment', 'parent')
  replies: any[];

  @OneToMany('Like', 'comment')
  likes: any[];
}
