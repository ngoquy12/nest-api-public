import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Article } from '../articles/entities/article.entity';
import { User } from '../users/entities/user.entity';
import { Like } from '../likes/entities/like.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Article, User, Like])],
  controllers: [CommentsController],
  providers: [CommentsService, JwtService, UsersService],
  exports: [CommentsService],
})
export class CommentsModule {}
