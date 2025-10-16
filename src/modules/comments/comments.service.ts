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
import { SearchCommentDto } from './dto/search-comment.dto';
import { CommentStatus } from './enums/comment-status.enum';
import {
  BaseResponse,
  PaginatedResponse,
} from 'src/common/responses/base-response';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import {
  CommentResponse,
  CommentTreeResponse,
} from './interfaces/comment.interface';
import { Article } from '../articles/entities/article.entity';
import { User } from '../users/entities/user.entity';

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

  // Thêm mới bình luận
  async createComment(
    user: JwtPayloadUser,
    createCommentDto: CreateCommentDto,
  ) {
    const { id } = user;

    const {
      content,
      articleId,
      parentId,
      status = CommentStatus.PENDING,
    } = createCommentDto;

    // Kiểm tra bài viết tồn tại
    const article = await this.articleRepository.findOne({
      where: { id: articleId, deletedAt: null },
    });

    if (!article) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    // Kiểm tra bình luận cha tồn tại (nếu có)
    if (parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentId, deletedAt: null },
      });

      if (!parentComment) {
        throw new NotFoundException('Không tìm thấy bình luận cha');
      }

      if (parentComment.articleId !== articleId) {
        throw new BadRequestException('Bình luận cha không thuộc bài viết này');
      }
    }

    // Tạo và lưu bình luận
    const newComment = this.commentRepository.create({
      content,
      status,
      parentId,
      articleId,
      userId: id,
      createdBy: id,
    });

    const savedComment = await this.commentRepository.save(newComment);

    // Cập nhật số lượng bình luận của bài viết
    await this.updateArticleCommentCount(articleId);

    // Cập nhật số lượng trả lời của bình luận cha (nếu có)
    if (parentId) {
      await this.updateCommentReplyCount(parentId);
    }

    // Load relations để trả về đầy đủ thông tin
    const commentWithRelations = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user', 'article', 'parent'],
    });

    const commentResponse: CommentResponse = {
      id: commentWithRelations.id,
      content: commentWithRelations.content,
      status: commentWithRelations.status,
      parentId: commentWithRelations.parentId,
      articleId: commentWithRelations.articleId,
      userId: commentWithRelations.userId,
      likeCount: commentWithRelations.likeCount,
      replyCount: commentWithRelations.replyCount,
      createdAt: commentWithRelations.createdAt,
      updatedAt: commentWithRelations.updatedAt,
      user: commentWithRelations.user
        ? {
            id: commentWithRelations.user.id,
            username: commentWithRelations.user.username,
            fullName: commentWithRelations.user.fullName,
            avatar: commentWithRelations.user.avatar,
          }
        : undefined,
      article: commentWithRelations.article
        ? {
            id: commentWithRelations.article.id,
            title: commentWithRelations.article.title,
            slug: commentWithRelations.article.slug,
          }
        : undefined,
      parent: commentWithRelations.parent
        ? {
            id: commentWithRelations.parent.id,
            content: commentWithRelations.parent.content,
            user: {
              id: commentWithRelations.parent.user.id,
              username: commentWithRelations.parent.user.username,
              fullName: commentWithRelations.parent.user.fullName,
            },
          }
        : undefined,
    };

    return new BaseResponse(
      HttpStatus.CREATED,
      'Thêm bình luận thành công',
      commentResponse,
    );
  }

  // Tìm kiếm và phân trang bình luận
  async searchAndPagingComment(
    query: SearchCommentDto,
  ): Promise<PaginatedResponse<CommentResponse>> {
    const {
      keyword,
      status,
      articleId,
      userId,
      parentId,
      currentPage = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    // 1. Tạo query builder
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.article', 'article')
      .leftJoinAndSelect('comment.parent', 'parent')
      .leftJoinAndSelect('parent.user', 'parentUser');

    // 2. Thêm điều kiện tìm kiếm
    if (keyword) {
      queryBuilder.andWhere('comment.content LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    // 3. Thêm điều kiện lọc
    if (status) {
      queryBuilder.andWhere('comment.status = :status', { status });
    }

    if (articleId) {
      queryBuilder.andWhere('comment.articleId = :articleId', { articleId });
    }

    if (userId) {
      queryBuilder.andWhere('comment.userId = :userId', { userId });
    }

    if (parentId !== undefined) {
      if (parentId === null) {
        queryBuilder.andWhere('comment.parentId IS NULL');
      } else {
        queryBuilder.andWhere('comment.parentId = :parentId', { parentId });
      }
    }

    queryBuilder.andWhere('comment.deletedAt IS NULL');
    queryBuilder.orderBy(`comment.${sortBy}`, sortOrder);

    queryBuilder.skip((currentPage - 1) * pageSize).take(pageSize);

    // 4. Đếm tổng bản ghi và lấy dữ liệu
    const [data, total] = await queryBuilder.getManyAndCount();

    // 5. Tạo dữ liệu phân trang
    const paginated = data.map((comment) => ({
      id: comment.id,
      content: comment.content,
      status: comment.status,
      parentId: comment.parentId,
      articleId: comment.articleId,
      userId: comment.userId,
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user
        ? {
            id: comment.user.id,
            username: comment.user.username,
            fullName: comment.user.fullName,
            avatar: comment.user.avatar,
          }
        : undefined,
      article: comment.article
        ? {
            id: comment.article.id,
            title: comment.article.title,
            slug: comment.article.slug,
          }
        : undefined,
      parent: comment.parent
        ? {
            id: comment.parent.id,
            content: comment.parent.content,
            user: {
              id: comment.parent.user.id,
              username: comment.parent.user.username,
              fullName: comment.parent.user.fullName,
            },
          }
        : undefined,
    }));

    // 6. Trả kết quả
    return new PaginatedResponse(
      HttpStatus.OK,
      'Lấy danh sách bình luận thành công',
      paginated,
      {
        totalRecords: total,
        currentPage: +currentPage,
        pageSize: +pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    );
  }

  // Lấy bình luận theo cây (tree structure) cho một bài viết
  async getCommentsByArticleId(
    articleId: number,
  ): Promise<BaseResponse<CommentTreeResponse[]>> {
    // Lấy tất cả bình luận của bài viết
    const comments = await this.commentRepository.find({
      where: {
        articleId,
        status: CommentStatus.APPROVED,
        deletedAt: null,
      },
      relations: ['user', 'parent', 'parent.user'],
      order: {
        createdAt: 'ASC',
      },
    });

    // Tạo cây bình luận
    const commentTree = this.buildCommentTree(comments);

    return new BaseResponse<CommentTreeResponse[]>(
      HttpStatus.OK,
      'Lấy danh sách bình luận thành công',
      commentTree,
    );
  }

  // Lấy thông tin chi tiết bình luận theo id
  async getCommentDetail(commentId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, deletedAt: null },
      relations: ['user', 'article', 'parent', 'parent.user'],
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy thông tin bình luận');
    }

    const commentResponse: CommentResponse = {
      id: comment.id,
      content: comment.content,
      status: comment.status,
      parentId: comment.parentId,
      articleId: comment.articleId,
      userId: comment.userId,
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user
        ? {
            id: comment.user.id,
            username: comment.user.username,
            fullName: comment.user.fullName,
            avatar: comment.user.avatar,
          }
        : undefined,
      article: comment.article
        ? {
            id: comment.article.id,
            title: comment.article.title,
            slug: comment.article.slug,
          }
        : undefined,
      parent: comment.parent
        ? {
            id: comment.parent.id,
            content: comment.parent.content,
            user: {
              id: comment.parent.user.id,
              username: comment.parent.user.username,
              fullName: comment.parent.user.fullName,
            },
          }
        : undefined,
    };

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy chi tiết bình luận thành công',
      commentResponse,
    );
  }

  // Cập nhật thông tin bình luận
  async updateComment(
    user: JwtPayloadUser,
    id: number,
    updateCommentDto: UpdateCommentDto,
  ) {
    const comment = await this.commentRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy thông tin bình luận');
    }

    // Kiểm tra quyền sở hữu
    if (comment.userId !== user.id) {
      throw new BadRequestException(
        'Bạn không có quyền chỉnh sửa bình luận này',
      );
    }

    // Cập nhật thông tin bình luận
    Object.assign(comment, {
      ...updateCommentDto,
      updatedBy: user.id,
    });

    const updatedComment = await this.commentRepository.save(comment);

    // Load relations để trả về đầy đủ thông tin
    const commentWithRelations = await this.commentRepository.findOne({
      where: { id: updatedComment.id },
      relations: ['user', 'article', 'parent', 'parent.user'],
    });

    const updatedCommentResponse: CommentResponse = {
      id: commentWithRelations.id,
      content: commentWithRelations.content,
      status: commentWithRelations.status,
      parentId: commentWithRelations.parentId,
      articleId: commentWithRelations.articleId,
      userId: commentWithRelations.userId,
      likeCount: commentWithRelations.likeCount,
      replyCount: commentWithRelations.replyCount,
      createdAt: commentWithRelations.createdAt,
      updatedAt: commentWithRelations.updatedAt,
      user: commentWithRelations.user
        ? {
            id: commentWithRelations.user.id,
            username: commentWithRelations.user.username,
            fullName: commentWithRelations.user.fullName,
            avatar: commentWithRelations.user.avatar,
          }
        : undefined,
      article: commentWithRelations.article
        ? {
            id: commentWithRelations.article.id,
            title: commentWithRelations.article.title,
            slug: commentWithRelations.article.slug,
          }
        : undefined,
      parent: commentWithRelations.parent
        ? {
            id: commentWithRelations.parent.id,
            content: commentWithRelations.parent.content,
            user: {
              id: commentWithRelations.parent.user.id,
              username: commentWithRelations.parent.user.username,
              fullName: commentWithRelations.parent.user.fullName,
            },
          }
        : undefined,
    };

    return new BaseResponse(
      HttpStatus.OK,
      'Cập nhật bình luận thành công',
      updatedCommentResponse,
    );
  }

  // Xóa bình luận theo id
  async removeCommentById(user: JwtPayloadUser, commentId: number) {
    const comment = await this.commentRepository.findOne({
      where: {
        id: commentId,
        deletedAt: null,
      },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy thông tin bình luận');
    }

    // Kiểm tra quyền sở hữu
    if (comment.userId !== user.id) {
      throw new BadRequestException('Bạn không có quyền xóa bình luận này');
    }

    // Thực hiện xóa mềm
    await this.commentRepository.softDelete(commentId);

    // Cập nhật số lượng bình luận của bài viết
    await this.updateArticleCommentCount(comment.articleId);

    // Cập nhật số lượng trả lời của bình luận cha (nếu có)
    if (comment.parentId) {
      await this.updateCommentReplyCount(comment.parentId);
    }

    return new BaseResponse(HttpStatus.OK, 'Xóa bình luận thành công', null);
  }

  // Duyệt bình luận
  async approveComment(commentId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, deletedAt: null },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy thông tin bình luận');
    }

    await this.commentRepository.update(commentId, {
      status: CommentStatus.APPROVED,
    });

    return new BaseResponse(HttpStatus.OK, 'Duyệt bình luận thành công', null);
  }

  // Từ chối bình luận
  async rejectComment(commentId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, deletedAt: null },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy thông tin bình luận');
    }

    await this.commentRepository.update(commentId, {
      status: CommentStatus.REJECTED,
    });

    return new BaseResponse(
      HttpStatus.OK,
      'Từ chối bình luận thành công',
      null,
    );
  }

  // Đánh dấu spam
  async markAsSpam(commentId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, deletedAt: null },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy thông tin bình luận');
    }

    await this.commentRepository.update(commentId, {
      status: CommentStatus.SPAM,
    });

    return new BaseResponse(HttpStatus.OK, 'Đánh dấu spam thành công', null);
  }

  // Cập nhật số lượng bình luận của bài viết
  private async updateArticleCommentCount(articleId: number) {
    const count = await this.commentRepository.count({
      where: {
        articleId,
        status: CommentStatus.APPROVED,
        deletedAt: null,
      },
    });

    await this.articleRepository.update(articleId, {
      commentCount: count,
    });
  }

  // Cập nhật số lượng trả lời của bình luận
  private async updateCommentReplyCount(commentId: number) {
    const count = await this.commentRepository.count({
      where: {
        parentId: commentId,
        status: CommentStatus.APPROVED,
        deletedAt: null,
      },
    });

    await this.commentRepository.update(commentId, {
      replyCount: count,
    });
  }

  // Xây dựng cây bình luận
  private buildCommentTree(comments: Comment[]): CommentTreeResponse[] {
    const commentMap = new Map<number, CommentTreeResponse>();
    const rootComments: CommentTreeResponse[] = [];

    // Tạo map các bình luận
    comments.forEach((comment) => {
      const commentResponse: CommentTreeResponse = {
        id: comment.id,
        content: comment.content,
        status: comment.status,
        parentId: comment.parentId,
        articleId: comment.articleId,
        userId: comment.userId,
        likeCount: comment.likeCount,
        replyCount: comment.replyCount,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user
          ? {
              id: comment.user.id,
              username: comment.user.username,
              fullName: comment.user.fullName,
              avatar: comment.user.avatar,
            }
          : undefined,
        article: comment.article
          ? {
              id: comment.article.id,
              title: comment.article.title,
              slug: comment.article.slug,
            }
          : undefined,
        parent: comment.parent
          ? {
              id: comment.parent.id,
              content: comment.parent.content,
              user: {
                id: comment.parent.user.id,
                username: comment.parent.user.username,
                fullName: comment.parent.user.fullName,
              },
            }
          : undefined,
        replies: [],
      };

      commentMap.set(comment.id, commentResponse);
    });

    // Xây dựng cây
    comments.forEach((comment) => {
      const commentResponse = commentMap.get(comment.id);
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentResponse);
        }
      } else {
        rootComments.push(commentResponse);
      }
    });

    return rootComments;
  }
}
