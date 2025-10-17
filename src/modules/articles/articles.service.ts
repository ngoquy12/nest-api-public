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
import {
  BaseResponse,
  PaginatedResponse,
} from 'src/common/responses/base-response';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
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

  // Tạo bài viết mới
  async createArticle(
    user: JwtPayloadUser,
    createArticleDto: CreateArticleDto,
  ) {
    const { id } = user;
    const { title, content, image, categoryId } = createArticleDto;

    // Kiểm tra danh mục tồn tại
    const category = await this.articleCategoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục bài viết');
    }

    // Tạo bài viết mới
    const newArticle = this.articleRepository.create({
      title,
      content,
      image,
      categoryId,
      authorId: id,
      createdBy: id,
    });

    const savedArticle = await this.articleRepository.save(newArticle);

    // Cập nhật số lượng bài viết trong danh mục
    await this.articleCategoryRepository.update(categoryId, {
      articleCount: () => 'articleCount + 1',
    });

    return new BaseResponse(HttpStatus.CREATED, 'Tạo bài viết thành công', {
      id: savedArticle.id,
      title: savedArticle.title,
      content: savedArticle.content,
      image: savedArticle.image,
      categoryId: savedArticle.categoryId,
      authorId: savedArticle.authorId,
      createdAt: savedArticle.createdAt,
    });
  }

  // Lấy danh sách bài viết với phân trang và tìm kiếm
  async getArticles(searchArticleDto: SearchArticleDto) {
    const {
      currentPage = 1,
      pageSize = 10,
      keyword = '',
      categoryId,
      authorId,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchArticleDto as any;

    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.author', 'author');

    // Tìm kiếm theo tiêu đề
    if (keyword) {
      queryBuilder.andWhere('article.title LIKE :keyword', {
        keyword: `%${keyword}%`,
      });
    }

    // Lọc theo danh mục
    if (categoryId) {
      queryBuilder.andWhere('article.categoryId = :categoryId', { categoryId });
    }

    // Lọc theo tác giả
    if (authorId) {
      queryBuilder.andWhere('article.authorId = :authorId', { authorId });
    }

    queryBuilder.orderBy(`article.${sortBy}`, sortOrder);
    queryBuilder.skip((currentPage - 1) * pageSize).take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();

    const articles = data.map((article) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      image: article.image,
      likeCount: article.likeCount,
      commentCount: article.commentCount,
      category: article.category
        ? {
            id: article.category.id,
            name: article.category.name,
            description: article.category.description,
          }
        : undefined,
      author: article.author
        ? {
            id: article.author.id,
            username: article.author.username,
            fullName: article.author.fullName,
            avatar: article.author.avatar,
          }
        : undefined,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    }));

    return new PaginatedResponse(
      HttpStatus.OK,
      'Lấy danh sách bài viết thành công',
      articles,
      {
        totalRecords: total,
        currentPage: +currentPage,
        pageSize: +pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    );
  }

  // Lấy tất cả bài viết (không tìm kiếm, không phân trang)
  async getAllArticles() {
    const articles = await this.articleRepository.find({
      relations: ['category', 'author'],
      order: { createdAt: 'DESC' },
    });

    const data = articles.map((article) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      image: article.image,
      likeCount: article.likeCount,
      commentCount: article.commentCount,
      category: article.category
        ? {
            id: article.category.id,
            name: article.category.name,
            description: article.category.description,
          }
        : undefined,
      author: article.author
        ? {
            id: article.author.id,
            username: article.author.username,
            fullName: article.author.fullName,
            avatar: article.author.avatar,
          }
        : undefined,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    }));

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy tất cả bài viết thành công',
      data,
    );
  }

  // Lấy bài viết của chính người dùng (không phân trang)
  async getMyArticles(user: JwtPayloadUser) {
    const articles = await this.articleRepository.find({
      where: { authorId: user.id },
      relations: ['category', 'author'],
      order: { createdAt: 'DESC' },
    });

    const data = articles.map((article) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      image: article.image,
      likeCount: article.likeCount,
      commentCount: article.commentCount,
      category: article.category
        ? {
            id: article.category.id,
            name: article.category.name,
            description: article.category.description,
          }
        : undefined,
      author: article.author
        ? {
            id: article.author.id,
            username: article.author.username,
            fullName: article.author.fullName,
            avatar: article.author.avatar,
          }
        : undefined,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    }));

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy danh sách bài viết cá nhân thành công',
      data,
    );
  }

  // Lấy chi tiết bài viết
  async getArticleDetail(articleId: number) {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
      relations: ['category', 'author'],
    });

    if (!article) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    return new BaseResponse(HttpStatus.OK, 'Lấy chi tiết bài viết thành công', {
      id: article.id,
      title: article.title,
      content: article.content,
      image: article.image,
      likeCount: article.likeCount,
      commentCount: article.commentCount,
      category: article.category
        ? {
            id: article.category.id,
            name: article.category.name,
            description: article.category.description,
          }
        : undefined,
      author: article.author
        ? {
            id: article.author.id,
            username: article.author.username,
            fullName: article.author.fullName,
            avatar: article.author.avatar,
          }
        : undefined,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    });
  }

  // Cập nhật bài viết
  async updateArticle(
    user: JwtPayloadUser,
    id: number,
    updateArticleDto: UpdateArticleDto,
  ) {
    const article = await this.articleRepository.findOne({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    if (article.authorId !== user.id) {
      throw new BadRequestException('Bạn không có quyền cập nhật bài viết này');
    }

    // Kiểm tra danh mục nếu có thay đổi
    if (
      updateArticleDto.categoryId &&
      updateArticleDto.categoryId !== article.categoryId
    ) {
      const category = await this.articleCategoryRepository.findOne({
        where: { id: updateArticleDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Không tìm thấy danh mục bài viết');
      }

      // Cập nhật số lượng bài viết trong danh mục cũ và mới
      await this.articleCategoryRepository.update(article.categoryId, {
        articleCount: () => 'articleCount - 1',
      });
      await this.articleCategoryRepository.update(updateArticleDto.categoryId, {
        articleCount: () => 'articleCount + 1',
      });
    }

    // Cập nhật thông tin bài viết
    Object.assign(article, {
      ...updateArticleDto,
      updatedBy: user.id,
    });

    const updatedArticle = await this.articleRepository.save(article);

    return new BaseResponse(HttpStatus.OK, 'Cập nhật bài viết thành công', {
      id: updatedArticle.id,
      title: updatedArticle.title,
      content: updatedArticle.content,
      image: updatedArticle.image,
      categoryId: updatedArticle.categoryId,
      authorId: updatedArticle.authorId,
      updatedAt: updatedArticle.updatedAt,
    });
  }

  // Xóa bài viết
  async deleteArticle(user: JwtPayloadUser, articleId: number) {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });

    if (!article) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    if (article.authorId !== user.id) {
      throw new BadRequestException('Bạn không có quyền xóa bài viết này');
    }

    // Xóa mềm bài viết
    await this.articleRepository.update(articleId, {
      deletedAt: new Date(),
    });

    // Cập nhật số lượng bài viết trong danh mục
    await this.articleCategoryRepository.update(article.categoryId, {
      articleCount: () => 'articleCount - 1',
    });

    return new BaseResponse(HttpStatus.OK, 'Xóa bài viết thành công', null);
  }
}
