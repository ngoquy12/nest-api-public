import { Module } from '@nestjs/common';
import { ArticleCategoriesService } from './article-categories.service';
import { ArticleCategoriesController } from './article-categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleCategory } from './entities/article-category.entity';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleCategory, User])],
  controllers: [ArticleCategoriesController],
  providers: [ArticleCategoriesService, JwtService, UsersService],
  exports: [ArticleCategoriesService],
})
export class ArticleCategoriesModule {}
