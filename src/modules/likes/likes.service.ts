import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLikeDto } from './dto/create-like.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { Article } from '../articles/entities/article.entity';
import { Comment } from '../comments/entities/comment.entity';
import { User } from '../users/entities/user.entity';
import { BaseResponse } from 'src/common/responses/base-response';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Like/Unlike bài viết hoặc bình luận
  async toggleLike(user: JwtPayloadUser, createLikeDto: CreateLikeDto) {
    const { id } = user;
    const { articleId, commentId } = createLikeDto;

    // Kiểm tra chỉ like một trong hai: bài viết hoặc bình luận
    if (!articleId && !commentId) {
      throw new BadRequestException(
        'Phải chỉ định bài viết hoặc bình luận để like',
      );
    }

    if (articleId && commentId) {
      throw new BadRequestException(
        'Không thể like cả bài viết và bình luận cùng lúc',
      );
    }

    // Kiểm tra bài viết hoặc bình luận tồn tại
    if (articleId) {
      const article = await this.articleRepository.findOne({
        where: { id: articleId },
      });

      if (!article) {
        throw new NotFoundException('Không tìm thấy bài viết');
      }
    }

    if (commentId) {
      const comment = await this.commentRepository.findOne({
        where: { id: commentId },
      });

      if (!comment) {
        throw new NotFoundException('Không tìm thấy bình luận');
      }
    }

    // Kiểm tra đã like chưa
    const existingLike = await this.likeRepository.findOne({
      where: {
        userId: id,
        articleId: articleId || null,
        commentId: commentId || null,
      },
    });

    if (existingLike) {
      // Nếu đã like thì unlike
      await this.likeRepository.update(existingLike.id, {
        deletedAt: new Date(),
      });

      // Cập nhật số lượng like
      if (articleId) {
        await this.articleRepository.update(articleId, {
          likeCount: () => 'likeCount - 1',
        });
      }

      if (commentId) {
        await this.commentRepository.update(commentId, {
          likeCount: () => 'likeCount - 1',
        });
      }

      return new BaseResponse(HttpStatus.OK, 'Bỏ like thành công', {
        liked: false,
        likeCount: articleId
          ? (await this.articleRepository.findOne({ where: { id: articleId } }))
              .likeCount
          : (await this.commentRepository.findOne({ where: { id: commentId } }))
              .likeCount,
      });
    } else {
      // Nếu chưa like thì like
      const newLike = this.likeRepository.create({
        userId: id,
        articleId: articleId || null,
        commentId: commentId || null,
        createdBy: id,
      });

      await this.likeRepository.save(newLike);

      // Cập nhật số lượng like
      if (articleId) {
        await this.articleRepository.update(articleId, {
          likeCount: () => 'likeCount + 1',
        });
      }

      if (commentId) {
        await this.commentRepository.update(commentId, {
          likeCount: () => 'likeCount + 1',
        });
      }

      return new BaseResponse(HttpStatus.OK, 'Like thành công', {
        liked: true,
        likeCount: articleId
          ? (await this.articleRepository.findOne({ where: { id: articleId } }))
              .likeCount
          : (await this.commentRepository.findOne({ where: { id: commentId } }))
              .likeCount,
      });
    }
  }

  // Lấy danh sách người đã like bài viết
  async getArticleLikes(articleId: number) {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    const likes = await this.likeRepository.find({
      where: { articleId },
      relations: ['user'],
    });

    const likedBy = likes.map((like) => ({
      id: like.user.id,
      username: like.user.username,
      fullName: like.user.fullName,
      avatar: like.user.avatar,
      likedAt: like.createdAt,
    }));

    return new BaseResponse(HttpStatus.OK, 'Lấy danh sách like thành công', {
      articleId,
      likeCount: article.likeCount,
      likedBy,
    });
  }

  // Lấy danh sách người đã like bình luận
  async getCommentLikes(commentId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    const likes = await this.likeRepository.find({
      where: { commentId },
      relations: ['user'],
    });

    const likedBy = likes.map((like) => ({
      id: like.user.id,
      username: like.user.username,
      fullName: like.user.fullName,
      avatar: like.user.avatar,
      likedAt: like.createdAt,
    }));

    return new BaseResponse(HttpStatus.OK, 'Lấy danh sách like thành công', {
      commentId,
      likeCount: comment.likeCount,
      likedBy,
    });
  }
}
