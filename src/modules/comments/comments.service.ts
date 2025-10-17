import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Article } from '../articles/entities/article.entity';
import { User } from '../users/entities/user.entity';
import { BaseResponse } from 'src/common/responses/base-response';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Tạo bình luận mới
  async createComment(
    user: JwtPayloadUser,
    createCommentDto: CreateCommentDto,
  ) {
    const { id } = user;
    const { content, articleId, parentId } = createCommentDto;

    // Kiểm tra bài viết tồn tại
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    // Kiểm tra bình luận cha nếu là reply
    if (parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentId, articleId },
      });

      if (!parentComment) {
        throw new NotFoundException('Không tìm thấy bình luận cha');
      }
    }

    // Tạo bình luận mới
    const newComment = this.commentRepository.create({
      content,
      articleId,
      parentId,
      userId: id,
      createdBy: id,
    });

    const savedComment = await this.commentRepository.save(newComment);

    // Cập nhật số lượng bình luận trong bài viết
    await this.articleRepository.update(articleId, {
      commentCount: () => 'commentCount + 1',
    });

    return new BaseResponse(HttpStatus.CREATED, 'Tạo bình luận thành công', {
      id: savedComment.id,
      content: savedComment.content,
      articleId: savedComment.articleId,
      parentId: savedComment.parentId,
      userId: savedComment.userId,
      createdAt: savedComment.createdAt,
    });
  }

  // Lấy danh sách bình luận của bài viết
  async getCommentsByArticle(articleId: number) {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.replies', 'replies')
      .leftJoinAndSelect('replies.user', 'replyUser')
      .where('comment.articleId = :articleId', { articleId })
      .andWhere('comment.parentId IS NULL') // Chỉ lấy bình luận gốc
      .orderBy('comment.createdAt', 'DESC');

    const data = await queryBuilder.getMany();

    const comments = data.map((comment) => ({
      id: comment.id,
      content: comment.content,
      likeCount: comment.likeCount,
      replyCount: comment.replies.length,
      userId: comment.userId,
      user: comment.user
        ? {
            id: comment.user.id,
            username: comment.user.username,
            fullName: comment.user.fullName,
            avatar: comment.user.avatar,
          }
        : undefined,
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        likeCount: reply.likeCount,
        userId: reply.userId,
        user: reply.user
          ? {
              id: reply.user.id,
              username: reply.user.username,
              fullName: reply.user.fullName,
              avatar: reply.user.avatar,
            }
          : undefined,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      })),
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy danh sách bình luận thành công',
      comments,
    );
  }

  // Cập nhật bình luận
  async updateComment(
    user: JwtPayloadUser,
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    if (comment.userId !== user.id) {
      throw new BadRequestException(
        'Bạn không có quyền cập nhật bình luận này',
      );
    }

    // Cập nhật bình luận
    Object.assign(comment, {
      ...updateCommentDto,
      updatedBy: user.id,
    });

    const updatedComment = await this.commentRepository.save(comment);

    return new BaseResponse(HttpStatus.OK, 'Cập nhật bình luận thành công', {
      id: updatedComment.id,
      content: updatedComment.content,
      updatedAt: updatedComment.updatedAt,
    });
  }

  // Xóa bình luận
  async deleteComment(user: JwtPayloadUser, commentId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    if (comment.userId !== user.id) {
      throw new BadRequestException('Bạn không có quyền xóa bình luận này');
    }

    // Xóa mềm bình luận
    await this.commentRepository.update(commentId, {
      deletedAt: new Date(),
    });

    // Cập nhật số lượng bình luận trong bài viết
    await this.articleRepository.update(comment.articleId, {
      commentCount: () => 'commentCount - 1',
    });

    return new BaseResponse(HttpStatus.OK, 'Xóa bình luận thành công', null);
  }
}
