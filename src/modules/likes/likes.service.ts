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
import { SearchLikeDto } from './dto/search-like.dto';
import { LikeType } from './enums/like-type.enum';
import {
  BaseResponse,
  PaginatedResponse,
} from 'src/common/responses/base-response';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import { LikeResponse, LikeStatsResponse } from './interfaces/like.interface';
import { Article } from '../articles/entities/article.entity';
import { Comment } from '../comments/entities/comment.entity';
import { User } from '../users/entities/user.entity';

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

  // Thêm like cho bài viết hoặc bình luận
  async createLike(user: JwtPayloadUser, createLikeDto: CreateLikeDto) {
    const { id } = user;

    const { articleId, commentId, type = LikeType.LIKE } = createLikeDto;

    // Kiểm tra phải có ít nhất một trong hai: articleId hoặc commentId
    if (!articleId && !commentId) {
      throw new BadRequestException('Phải có ID bài viết hoặc ID bình luận');
    }

    if (articleId && commentId) {
      throw new BadRequestException(
        'Chỉ có thể like bài viết hoặc bình luận, không thể like cả hai',
      );
    }

    // Kiểm tra bài viết tồn tại (nếu like bài viết)
    if (articleId) {
      const article = await this.articleRepository.findOne({
        where: { id: articleId, deletedAt: null },
      });

      if (!article) {
        throw new NotFoundException('Không tìm thấy bài viết');
      }
    }

    // Kiểm tra bình luận tồn tại (nếu like bình luận)
    if (commentId) {
      const comment = await this.commentRepository.findOne({
        where: { id: commentId, deletedAt: null },
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
        deletedAt: null,
      },
    });

    if (existingLike) {
      // Nếu đã like cùng loại thì bỏ like
      if (existingLike.type === type) {
        await this.likeRepository.softDelete(existingLike.id);

        // Cập nhật số lượng like
        if (articleId) {
          await this.updateArticleLikeCount(articleId);
        }
        if (commentId) {
          await this.updateCommentLikeCount(commentId);
        }

        return new BaseResponse(HttpStatus.OK, 'Bỏ like thành công', null);
      } else {
        // Nếu like khác loại thì cập nhật loại like
        await this.likeRepository.update(existingLike.id, {
          type,
          updatedBy: id,
        });

        return new BaseResponse(
          HttpStatus.OK,
          'Cập nhật like thành công',
          null,
        );
      }
    }

    // Tạo và lưu like mới
    const newLike = this.likeRepository.create({
      userId: id,
      articleId: articleId || null,
      commentId: commentId || null,
      type,
      createdBy: id,
    });

    const savedLike = await this.likeRepository.save(newLike);

    // Cập nhật số lượng like
    if (articleId) {
      await this.updateArticleLikeCount(articleId);
    }
    if (commentId) {
      await this.updateCommentLikeCount(commentId);
    }

    // Load relations để trả về đầy đủ thông tin
    const likeWithRelations = await this.likeRepository.findOne({
      where: { id: savedLike.id },
      relations: ['user', 'article', 'comment'],
    });

    const likeResponse: LikeResponse = {
      id: likeWithRelations.id,
      userId: likeWithRelations.userId,
      articleId: likeWithRelations.articleId,
      commentId: likeWithRelations.commentId,
      type: likeWithRelations.type,
      createdAt: likeWithRelations.createdAt,
      user: likeWithRelations.user
        ? {
            id: likeWithRelations.user.id,
            username: likeWithRelations.user.username,
            fullName: likeWithRelations.user.fullName,
            avatar: likeWithRelations.user.avatar,
          }
        : undefined,
      article: likeWithRelations.article
        ? {
            id: likeWithRelations.article.id,
            title: likeWithRelations.article.title,
            slug: likeWithRelations.article.slug,
          }
        : undefined,
      comment: likeWithRelations.comment
        ? {
            id: likeWithRelations.comment.id,
            content: likeWithRelations.comment.content,
          }
        : undefined,
    };

    return new BaseResponse(
      HttpStatus.CREATED,
      'Like thành công',
      likeResponse,
    );
  }

  // Tìm kiếm và phân trang like
  async searchAndPagingLike(
    query: SearchLikeDto,
  ): Promise<PaginatedResponse<LikeResponse>> {
    const {
      type,
      articleId,
      commentId,
      userId,
      currentPage = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    // 1. Tạo query builder
    const queryBuilder = this.likeRepository
      .createQueryBuilder('like')
      .leftJoinAndSelect('like.user', 'user')
      .leftJoinAndSelect('like.article', 'article')
      .leftJoinAndSelect('like.comment', 'comment');

    // 2. Thêm điều kiện lọc
    if (type) {
      queryBuilder.andWhere('like.type = :type', { type });
    }

    if (articleId) {
      queryBuilder.andWhere('like.articleId = :articleId', { articleId });
    }

    if (commentId) {
      queryBuilder.andWhere('like.commentId = :commentId', { commentId });
    }

    if (userId) {
      queryBuilder.andWhere('like.userId = :userId', { userId });
    }

    queryBuilder.andWhere('like.deletedAt IS NULL');
    queryBuilder.orderBy(`like.${sortBy}`, sortOrder);

    queryBuilder.skip((currentPage - 1) * pageSize).take(pageSize);

    // 3. Đếm tổng bản ghi và lấy dữ liệu
    const [data, total] = await queryBuilder.getManyAndCount();

    // 4. Tạo dữ liệu phân trang
    const paginated = data.map((like) => ({
      id: like.id,
      userId: like.userId,
      articleId: like.articleId,
      commentId: like.commentId,
      type: like.type,
      createdAt: like.createdAt,
      user: like.user
        ? {
            id: like.user.id,
            username: like.user.username,
            fullName: like.user.fullName,
            avatar: like.user.avatar,
          }
        : undefined,
      article: like.article
        ? {
            id: like.article.id,
            title: like.article.title,
            slug: like.article.slug,
          }
        : undefined,
      comment: like.comment
        ? {
            id: like.comment.id,
            content: like.comment.content,
          }
        : undefined,
    }));

    // 5. Trả kết quả
    return new PaginatedResponse(
      HttpStatus.OK,
      'Lấy danh sách like thành công',
      paginated,
      {
        totalRecords: total,
        currentPage: +currentPage,
        pageSize: +pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    );
  }

  // Lấy thống kê like cho bài viết
  async getArticleLikeStats(
    articleId: number,
    userId?: number,
  ): Promise<BaseResponse<LikeStatsResponse>> {
    const article = await this.articleRepository.findOne({
      where: { id: articleId, deletedAt: null },
    });

    if (!article) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    // Lấy tổng số like
    const totalLikes = await this.likeRepository.count({
      where: {
        articleId,
        deletedAt: null,
      },
    });

    // Lấy thống kê theo loại like
    const likeTypes = await this.likeRepository
      .createQueryBuilder('like')
      .select('like.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('like.articleId = :articleId', { articleId })
      .andWhere('like.deletedAt IS NULL')
      .groupBy('like.type')
      .getRawMany();

    // Kiểm tra user đã like chưa
    let userLiked = false;
    let userLikeType: string | undefined;

    if (userId) {
      const userLike = await this.likeRepository.findOne({
        where: {
          userId,
          articleId,
          deletedAt: null,
        },
      });

      if (userLike) {
        userLiked = true;
        userLikeType = userLike.type;
      }
    }

    const statsResponse: LikeStatsResponse = {
      totalLikes,
      likeTypes: likeTypes.map((item) => ({
        type: item.type,
        count: parseInt(item.count),
      })),
      userLiked,
      userLikeType,
    };

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy thống kê like thành công',
      statsResponse,
    );
  }

  // Lấy thống kê like cho bình luận
  async getCommentLikeStats(
    commentId: number,
    userId?: number,
  ): Promise<BaseResponse<LikeStatsResponse>> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, deletedAt: null },
    });

    if (!comment) {
      throw new NotFoundException('Không tìm thấy bình luận');
    }

    // Lấy tổng số like
    const totalLikes = await this.likeRepository.count({
      where: {
        commentId,
        deletedAt: null,
      },
    });

    // Lấy thống kê theo loại like
    const likeTypes = await this.likeRepository
      .createQueryBuilder('like')
      .select('like.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('like.commentId = :commentId', { commentId })
      .andWhere('like.deletedAt IS NULL')
      .groupBy('like.type')
      .getRawMany();

    // Kiểm tra user đã like chưa
    let userLiked = false;
    let userLikeType: string | undefined;

    if (userId) {
      const userLike = await this.likeRepository.findOne({
        where: {
          userId,
          commentId,
          deletedAt: null,
        },
      });

      if (userLike) {
        userLiked = true;
        userLikeType = userLike.type;
      }
    }

    const statsResponse: LikeStatsResponse = {
      totalLikes,
      likeTypes: likeTypes.map((item) => ({
        type: item.type,
        count: parseInt(item.count),
      })),
      userLiked,
      userLikeType,
    };

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy thống kê like thành công',
      statsResponse,
    );
  }

  // Xóa like
  async removeLike(user: JwtPayloadUser, likeId: number) {
    const like = await this.likeRepository.findOne({
      where: {
        id: likeId,
        deletedAt: null,
      },
    });

    if (!like) {
      throw new NotFoundException('Không tìm thấy like');
    }

    // Kiểm tra quyền sở hữu
    if (like.userId !== user.id) {
      throw new BadRequestException('Bạn không có quyền xóa like này');
    }

    // Thực hiện xóa mềm
    await this.likeRepository.softDelete(likeId);

    // Cập nhật số lượng like
    if (like.articleId) {
      await this.updateArticleLikeCount(like.articleId);
    }
    if (like.commentId) {
      await this.updateCommentLikeCount(like.commentId);
    }

    return new BaseResponse(HttpStatus.OK, 'Xóa like thành công', null);
  }

  // Cập nhật số lượng like của bài viết
  private async updateArticleLikeCount(articleId: number) {
    const count = await this.likeRepository.count({
      where: {
        articleId,
        deletedAt: null,
      },
    });

    await this.articleRepository.update(articleId, {
      likeCount: count,
    });
  }

  // Cập nhật số lượng like của bình luận
  private async updateCommentLikeCount(commentId: number) {
    const count = await this.likeRepository.count({
      where: {
        commentId,
        deletedAt: null,
      },
    });

    await this.commentRepository.update(commentId, {
      likeCount: count,
    });
  }
}
