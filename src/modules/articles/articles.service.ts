import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import { SearchArticleDto } from './dto/search-article.dto';
import { ArticleStatus } from './enums/article-status.enum';
import { ArticleVisibility } from './enums/article-visibility.enum';
import {
  BaseResponse,
  PaginatedResponse,
} from 'src/common/responses/base-response';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import {
  ArticleResponse,
  ArticleDetailResponse,
} from './interfaces/article.interface';
import { ArticleCategory } from '../article-categories/entities/article-category.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(ArticleCategory)
    private readonly articleCategoryRepository: Repository<ArticleCategory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Thêm mới bài viết
  async createArticle(
    user: JwtPayloadUser,
    createArticleDto: CreateArticleDto,
  ) {
    const { id } = user;

    const {
      title,
      summary,
      content,
      slug,
      featuredImage,
      status = ArticleStatus.DRAFT,
      visibility = ArticleVisibility.PUBLIC,
      tags = [],
      publishedAt,
      categoryId,
    } = createArticleDto;

    // Kiểm tra danh mục tồn tại
    const category = await this.articleCategoryRepository.findOne({
      where: { id: categoryId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục bài viết');
    }

    // Kiểm tra trùng slug
    const existingSlug = await this.articleRepository.findOne({
      where: {
        slug: slug || this.generateSlug(title),
        deletedAt: null,
      },
    });

    if (existingSlug) {
      throw new BadRequestException('Slug bài viết đã tồn tại trong hệ thống');
    }

    // Tạo và lưu bài viết
    const newArticle = this.articleRepository.create({
      title,
      summary,
      content,
      slug: slug || this.generateSlug(title),
      featuredImage,
      status,
      visibility,
      tags,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
      categoryId,
      authorId: id,
      createdBy: id,
    });

    const savedArticle = await this.articleRepository.save(newArticle);

    // Load relations để trả về đầy đủ thông tin
    const articleWithRelations = await this.articleRepository.findOne({
      where: { id: savedArticle.id },
      relations: ['articleCategory', 'author'],
    });

    const articleResponse: ArticleResponse = {
      id: articleWithRelations.id,
      title: articleWithRelations.title,
      summary: articleWithRelations.summary,
      content: articleWithRelations.content,
      slug: articleWithRelations.slug,
      featuredImage: articleWithRelations.featuredImage,
      status: articleWithRelations.status,
      visibility: articleWithRelations.visibility,
      viewCount: articleWithRelations.viewCount,
      likeCount: articleWithRelations.likeCount,
      commentCount: articleWithRelations.commentCount,
      tags: articleWithRelations.tags,
      publishedAt: articleWithRelations.publishedAt,
      categoryId: articleWithRelations.categoryId,
      authorId: articleWithRelations.authorId,
      createdAt: articleWithRelations.createdAt,
      updatedAt: articleWithRelations.updatedAt,
      category: articleWithRelations.articleCategory
        ? {
            id: articleWithRelations.articleCategory.id,
            categoryName: articleWithRelations.articleCategory.categoryName,
            categorySlug: articleWithRelations.articleCategory.categorySlug,
          }
        : undefined,
      author: articleWithRelations.author
        ? {
            id: articleWithRelations.author.id,
            username: articleWithRelations.author.username,
            email: articleWithRelations.author.email,
            fullName: articleWithRelations.author.fullName,
          }
        : undefined,
    };

    return new BaseResponse(
      HttpStatus.CREATED,
      'Thêm bài viết thành công',
      articleResponse,
    );
  }

  // Tìm kiếm và phân trang bài viết
  async searchAndPagingArticle(
    query: SearchArticleDto,
  ): Promise<PaginatedResponse<ArticleResponse>> {
    const {
      keyword,
      status,
      visibility,
      categoryId,
      authorId,
      tags,
      currentPage = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    // 1. Tạo query builder
    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.articleCategory', 'category')
      .leftJoinAndSelect('article.author', 'author');

    // 2. Thêm điều kiện tìm kiếm
    if (keyword) {
      queryBuilder.andWhere(
        '(article.title LIKE :keyword OR article.summary LIKE :keyword OR article.content LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 3. Thêm điều kiện lọc
    if (status) {
      queryBuilder.andWhere('article.status = :status', { status });
    }

    if (visibility) {
      queryBuilder.andWhere('article.visibility = :visibility', { visibility });
    }

    if (categoryId) {
      queryBuilder.andWhere('article.categoryId = :categoryId', { categoryId });
    }

    if (authorId) {
      queryBuilder.andWhere('article.authorId = :authorId', { authorId });
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('JSON_OVERLAPS(article.tags, :tags)', {
        tags: JSON.stringify(tags),
      });
    }

    queryBuilder.andWhere('article.deletedAt IS NULL');
    queryBuilder.orderBy(`article.${sortBy}`, sortOrder);

    queryBuilder.skip((currentPage - 1) * pageSize).take(pageSize);

    // 4. Đếm tổng bản ghi và lấy dữ liệu
    const [data, total] = await queryBuilder.getManyAndCount();

    // 5. Tạo dữ liệu phân trang
    const paginated = data.map((article) => ({
      id: article.id,
      title: article.title,
      summary: article.summary,
      content: article.content,
      slug: article.slug,
      featuredImage: article.featuredImage,
      status: article.status,
      visibility: article.visibility,
      viewCount: article.viewCount,
      likeCount: article.likeCount,
      commentCount: article.commentCount,
      tags: article.tags,
      publishedAt: article.publishedAt,
      categoryId: article.categoryId,
      authorId: article.authorId,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      category: article.articleCategory
        ? {
            id: article.articleCategory.id,
            categoryName: article.articleCategory.categoryName,
            categorySlug: article.articleCategory.categorySlug,
          }
        : undefined,
      author: article.author
        ? {
            id: article.author.id,
            username: article.author.username,
            email: article.author.email,
            fullName: article.author.fullName,
          }
        : undefined,
    }));

    // 6. Trả kết quả
    return new PaginatedResponse(
      HttpStatus.OK,
      'Lấy danh sách bài viết thành công',
      paginated,
      {
        totalRecords: total,
        currentPage: +currentPage,
        pageSize: +pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    );
  }

  // Lấy thông tin chi tiết bài viết theo id
  async getArticleDetail(articleId: number) {
    const article = await this.articleRepository.findOne({
      where: { id: articleId, deletedAt: null },
      relations: ['articleCategory', 'author'],
    });

    if (!article) {
      throw new NotFoundException('Không tìm thấy thông tin bài viết');
    }

    // Tăng view count
    await this.articleRepository.update(articleId, {
      viewCount: article.viewCount + 1,
    });

    const articleDetailResponse: ArticleDetailResponse = {
      id: article.id,
      title: article.title,
      summary: article.summary,
      content: article.content,
      slug: article.slug,
      featuredImage: article.featuredImage,
      status: article.status,
      visibility: article.visibility,
      viewCount: article.viewCount + 1,
      likeCount: article.likeCount,
      commentCount: article.commentCount,
      tags: article.tags,
      publishedAt: article.publishedAt,
      categoryId: article.categoryId,
      authorId: article.authorId,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      category: {
        id: article.articleCategory.id,
        categoryName: article.articleCategory.categoryName,
        categorySlug: article.articleCategory.categorySlug,
        categoryDescription: article.articleCategory.categoryDescription,
      },
      author: {
        id: article.author.id,
        username: article.author.username,
        email: article.author.email,
        fullName: article.author.fullName,
        avatar: article.author.avatar,
      },
    };

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy chi tiết bài viết thành công',
      articleDetailResponse,
    );
  }

  // Lấy bài viết theo slug
  async getArticleBySlug(slug: string) {
    const article = await this.articleRepository.findOne({
      where: { slug, deletedAt: null },
      relations: ['articleCategory', 'author'],
    });

    if (!article) {
      throw new NotFoundException('Không tìm thấy thông tin bài viết');
    }

    // Tăng view count
    await this.articleRepository.update(article.id, {
      viewCount: article.viewCount + 1,
    });

    const articleDetailResponse: ArticleDetailResponse = {
      id: article.id,
      title: article.title,
      summary: article.summary,
      content: article.content,
      slug: article.slug,
      featuredImage: article.featuredImage,
      status: article.status,
      visibility: article.visibility,
      viewCount: article.viewCount + 1,
      likeCount: article.likeCount,
      commentCount: article.commentCount,
      tags: article.tags,
      publishedAt: article.publishedAt,
      categoryId: article.categoryId,
      authorId: article.authorId,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      category: {
        id: article.articleCategory.id,
        categoryName: article.articleCategory.categoryName,
        categorySlug: article.articleCategory.categorySlug,
        categoryDescription: article.articleCategory.categoryDescription,
      },
      author: {
        id: article.author.id,
        username: article.author.username,
        email: article.author.email,
        fullName: article.author.fullName,
        avatar: article.author.avatar,
      },
    };

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy chi tiết bài viết thành công',
      articleDetailResponse,
    );
  }

  // Cập nhật thông tin bài viết
  async updateArticle(
    user: JwtPayloadUser,
    id: number,
    updateArticleDto: UpdateArticleDto,
  ) {
    const { title, slug, categoryId } = updateArticleDto;

    const article = await this.articleRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!article) {
      throw new NotFoundException('Không tìm thấy thông tin bài viết');
    }

    // Kiểm tra quyền sở hữu
    if (article.authorId !== user.id) {
      throw new BadRequestException(
        'Bạn không có quyền chỉnh sửa bài viết này',
      );
    }

    // Kiểm tra danh mục tồn tại (nếu có thay đổi)
    if (categoryId && categoryId !== article.categoryId) {
      const category = await this.articleCategoryRepository.findOne({
        where: { id: categoryId, deletedAt: null },
      });

      if (!category) {
        throw new NotFoundException('Không tìm thấy danh mục bài viết');
      }
    }

    // Kiểm tra trùng slug (nếu có thay đổi)
    if (slug && slug !== article.slug) {
      const existingSlug = await this.articleRepository.findOne({
        where: {
          slug: slug.trim(),
          deletedAt: null,
        },
      });

      if (existingSlug) {
        throw new BadRequestException(
          'Slug bài viết đã tồn tại trong hệ thống',
        );
      }
    }

    // Cập nhật thông tin bài viết
    Object.assign(article, {
      ...updateArticleDto,
      slug: slug || (title ? this.generateSlug(title) : article.slug),
      updatedBy: user.id,
    });

    const updatedArticle = await this.articleRepository.save(article);

    // Load relations để trả về đầy đủ thông tin
    const articleWithRelations = await this.articleRepository.findOne({
      where: { id: updatedArticle.id },
      relations: ['articleCategory', 'author'],
    });

    const updatedArticleResponse: ArticleResponse = {
      id: articleWithRelations.id,
      title: articleWithRelations.title,
      summary: articleWithRelations.summary,
      content: articleWithRelations.content,
      slug: articleWithRelations.slug,
      featuredImage: articleWithRelations.featuredImage,
      status: articleWithRelations.status,
      visibility: articleWithRelations.visibility,
      viewCount: articleWithRelations.viewCount,
      likeCount: articleWithRelations.likeCount,
      commentCount: articleWithRelations.commentCount,
      tags: articleWithRelations.tags,
      publishedAt: articleWithRelations.publishedAt,
      categoryId: articleWithRelations.categoryId,
      authorId: articleWithRelations.authorId,
      createdAt: articleWithRelations.createdAt,
      updatedAt: articleWithRelations.updatedAt,
      category: articleWithRelations.articleCategory
        ? {
            id: articleWithRelations.articleCategory.id,
            categoryName: articleWithRelations.articleCategory.categoryName,
            categorySlug: articleWithRelations.articleCategory.categorySlug,
          }
        : undefined,
      author: articleWithRelations.author
        ? {
            id: articleWithRelations.author.id,
            username: articleWithRelations.author.username,
            email: articleWithRelations.author.email,
            fullName: articleWithRelations.author.fullName,
          }
        : undefined,
    };

    return new BaseResponse(
      HttpStatus.OK,
      'Cập nhật bài viết thành công',
      updatedArticleResponse,
    );
  }

  // Xóa bài viết theo id
  async removeArticleById(user: JwtPayloadUser, articleId: number) {
    const article = await this.articleRepository.findOne({
      where: {
        id: articleId,
        deletedAt: null,
      },
    });

    if (!article) {
      throw new NotFoundException('Không tìm thấy thông tin bài viết');
    }

    // Kiểm tra quyền sở hữu
    if (article.authorId !== user.id) {
      throw new BadRequestException('Bạn không có quyền xóa bài viết này');
    }

    // Thực hiện xóa mềm
    await this.articleRepository.softDelete(articleId);

    return new BaseResponse(HttpStatus.OK, 'Xóa bài viết thành công', null);
  }

  // Xuất bản bài viết
  async publishArticle(user: JwtPayloadUser, articleId: number) {
    const article = await this.articleRepository.findOne({
      where: { id: articleId, deletedAt: null },
    });

    if (!article) {
      throw new NotFoundException('Không tìm thấy thông tin bài viết');
    }

    // Kiểm tra quyền sở hữu
    if (article.authorId !== user.id) {
      throw new BadRequestException('Bạn không có quyền xuất bản bài viết này');
    }

    // Cập nhật trạng thái và thời gian xuất bản
    await this.articleRepository.update(articleId, {
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      updatedBy: user.id,
    });

    return new BaseResponse(
      HttpStatus.OK,
      'Xuất bản bài viết thành công',
      null,
    );
  }

  // Lưu trữ bài viết
  async archiveArticle(user: JwtPayloadUser, articleId: number) {
    const article = await this.articleRepository.findOne({
      where: { id: articleId, deletedAt: null },
    });

    if (!article) {
      throw new NotFoundException('Không tìm thấy thông tin bài viết');
    }

    // Kiểm tra quyền sở hữu
    if (article.authorId !== user.id) {
      throw new BadRequestException('Bạn không có quyền lưu trữ bài viết này');
    }

    // Cập nhật trạng thái
    await this.articleRepository.update(articleId, {
      status: ArticleStatus.ARCHIVED,
      updatedBy: user.id,
    });

    return new BaseResponse(HttpStatus.OK, 'Lưu trữ bài viết thành công', null);
  }

  // Tạo slug từ tiêu đề bài viết
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
