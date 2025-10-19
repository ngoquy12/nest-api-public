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
    // Lấy toàn bộ bình luận của bài viết (bao gồm user) rồi build cây replies vô hạn cấp
    const allComments = await this.commentRepository.find({
      where: { articleId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    const idToNode = new Map<number, any>();
    const roots: any[] = [];

    // Khởi tạo node map
    for (const c of allComments) {
      idToNode.set(c.id, {
        id: c.id,
        content: c.content,
        likeCount: c.likeCount,
        userId: c.userId,
        user: c.user
          ? {
              id: c.user.id,
              username: c.user.username,
              fullName: c.user.fullName,
              avatar: c.user.avatar,
            }
          : undefined,
        replies: [],
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    }

    // Liên kết parent -> replies
    for (const c of allComments) {
      const node = idToNode.get(c.id);
      if (c.parentId) {
        const parentNode = idToNode.get(c.parentId);
        if (parentNode) parentNode.replies.push(node);
        else roots.push(node); // fallback nếu thiếu parent
      } else {
        roots.push(node);
      }
    }

    // Tính replyCount theo tổng số replies (đệ quy)
    const computeReplyCount = (node: any): number => {
      if (!node.replies || node.replies.length === 0) return 0;
      let count = node.replies.length;
      for (const child of node.replies) count += computeReplyCount(child);
      return count;
    };

    for (const root of roots) {
      root.replyCount = computeReplyCount(root);
    }

    // Sắp xếp root theo thời gian mới nhất trước (giống behavior cũ DESC),
    // trong khi đã tải all ASC để giữ thứ tự hội thoại trong nhánh.
    roots.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy danh sách bình luận thành công',
      roots,
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
