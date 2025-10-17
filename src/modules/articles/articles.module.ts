import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { SavedArticle } from './entities/saved-article.entity';
import { ArticleCategory } from '../article-categories/entities/article-category.entity';
import { User } from '../users/entities/user.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Like } from '../likes/entities/like.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ArticlesService } from './articles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Article,
      ArticleCategory,
      User,
      Comment,
      Like,
      SavedArticle,
    ]),
  ],
  controllers: [ArticlesController],
  providers: [ArticlesService, JwtService, UsersService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
