import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('saved_articles')
@Unique(['userId', 'articleId'])
export class SavedArticle extends BaseEntity {
  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  articleId: number;

  @ManyToOne('User', 'savedArticles')
  @JoinColumn({ name: 'user_id' })
  user: any;

  @ManyToOne('Article', 'savedByUsers')
  @JoinColumn({ name: 'article_id' })
  article: any;
}
