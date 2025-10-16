import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Article } from '../articles/entities/article.entity';
import { Comment } from '../comments/entities/comment.entity';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Article, Comment, User])],
  controllers: [LikesController],
  providers: [LikesService, JwtService, UsersService],
  exports: [LikesService],
})
export class LikesModule {}
