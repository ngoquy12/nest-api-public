import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { ArticleCategory } from '../article-categories/entities/article-category.entity';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([Article, ArticleCategory, User])],
  controllers: [ArticlesController],
  providers: [ArticlesService, JwtService, UsersService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
