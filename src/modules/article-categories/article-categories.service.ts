import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateArticleCategoryDto } from './dto/create-article-category.dto';
import { UpdateArticleCategoryDto } from './dto/update-article-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleCategory } from './entities/article-category.entity';
import { SearchArticleCategoryDto } from './dto/search-article-category.dto';
import { ArticleCategoryStatus } from './enums/article-category-status.enum';
import {
  BaseResponse,
  PaginatedResponse,
} from 'src/common/responses/base-response';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import { ArticleCategoryResponse } from './interfaces/article-category.interface';

@Injectable()
export class ArticleCategoriesService {
  constructor(
    @InjectRepository(ArticleCategory)
    private readonly articleCategoryRepository: Repository<ArticleCategory>,
  ) {}

  // Thêm mới danh mục bài viết
  async createArticleCategory(
    user: JwtPayloadUser,
    createArticleCategoryDto: CreateArticleCategoryDto,
  ) {
    const { id } = user;

    const {
      categoryName,
      categoryDescription,
      categoryStatus = ArticleCategoryStatus.ACTIVE,
      categorySlug,
      categoryImage,
      sortOrder = 0,
    } = createArticleCategoryDto;

    // Kiểm tra trùng tên
    const existingCategory = await this.articleCategoryRepository.findOne({
      where: {
        categoryName: categoryName.trim(),
        deletedAt: null,
      },
    });

    if (existingCategory) {
      throw new BadRequestException('Tên danh mục đã tồn tại trong hệ thống');
    }

    // Kiểm tra trùng slug nếu có
    if (categorySlug) {
      const existingSlug = await this.articleCategoryRepository.findOne({
        where: {
          categorySlug: categorySlug.trim(),
          deletedAt: null,
        },
      });

      if (existingSlug) {
        throw new BadRequestException(
          'Slug danh mục đã tồn tại trong hệ thống',
        );
      }
    }

    // Tạo và lưu danh mục
    const newCategory = this.articleCategoryRepository.create({
      categoryName,
      categoryDescription,
      categoryStatus,
      categorySlug: categorySlug || this.generateSlug(categoryName),
      categoryImage,
      sortOrder,
      createdBy: id,
    });

    const savedCategory =
      await this.articleCategoryRepository.save(newCategory);

    const categoryResponse: ArticleCategoryResponse = {
      id: savedCategory.id,
      categoryName: savedCategory.categoryName,
      categoryDescription: savedCategory.categoryDescription,
      categoryStatus: savedCategory.categoryStatus,
      categorySlug: savedCategory.categorySlug,
      categoryImage: savedCategory.categoryImage,
      sortOrder: savedCategory.sortOrder,
      createdAt: savedCategory.createdAt,
      updatedAt: savedCategory.updatedAt,
    };

    return new BaseResponse(
      HttpStatus.CREATED,
      'Thêm danh mục bài viết thành công',
      categoryResponse,
    );
  }

  // Tìm kiếm và phân trang danh mục bài viết
  async searchAndPagingArticleCategory(
    query: SearchArticleCategoryDto,
  ): Promise<PaginatedResponse<ArticleCategoryResponse>> {
    const { keyword, currentPage = 1, pageSize = 10, categoryStatus } = query;

    // 1. Tạo query builder
    const queryBuilder =
      this.articleCategoryRepository.createQueryBuilder('category');

    // 2. Thêm điều kiện tìm kiếm
    if (keyword) {
      queryBuilder.andWhere(
        '(category.categoryName LIKE :keyword OR category.categoryDescription LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 3. Thêm điều kiện lọc trạng thái
    if (categoryStatus) {
      queryBuilder.andWhere('category.categoryStatus = :status', {
        status: categoryStatus,
      });
    }

    queryBuilder.andWhere('category.deletedAt IS NULL');
    queryBuilder.orderBy('category.sortOrder', 'ASC');
    queryBuilder.addOrderBy('category.createdAt', 'DESC');

    queryBuilder.skip((currentPage - 1) * pageSize).take(pageSize);

    // 4. Đếm tổng bản ghi và lấy dữ liệu
    const [data, total] = await queryBuilder.getManyAndCount();

    // 5. Tạo dữ liệu phân trang
    const paginated = data.map((category) => ({
      id: category.id,
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription,
      categoryStatus: category.categoryStatus,
      categorySlug: category.categorySlug,
      categoryImage: category.categoryImage,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    // 6. Trả kết quả
    return new PaginatedResponse(
      HttpStatus.OK,
      'Lấy danh sách danh mục bài viết thành công',
      paginated,
      {
        totalRecords: total,
        currentPage: +currentPage,
        pageSize: +pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    );
  }

  // Lấy thông tin chi tiết danh mục bài viết theo id
  async getArticleCategoryDetail(categoryId: number) {
    const category = await this.articleCategoryRepository.findOne({
      where: { id: categoryId, deletedAt: null },
      relations: ['articles'],
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy thông tin danh mục bài viết');
    }

    // Thông tin cơ bản danh mục
    const categoryDetailResponse: ArticleCategoryResponse = {
      id: category.id,
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription,
      categoryStatus: category.categoryStatus,
      categorySlug: category.categorySlug,
      categoryImage: category.categoryImage,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      articleCount: category.articles?.length || 0,
    };

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy chi tiết danh mục bài viết thành công',
      categoryDetailResponse,
    );
  }

  // Cập nhật thông tin danh mục bài viết
  async updateArticleCategory(
    user: JwtPayloadUser,
    id: number,
    updateArticleCategoryDto: UpdateArticleCategoryDto,
  ) {
    const { categoryName, categorySlug } = updateArticleCategoryDto;

    const category = await this.articleCategoryRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy thông tin danh mục bài viết');
    }

    // Kiểm tra trùng tên (nếu có thay đổi tên)
    if (categoryName && categoryName !== category.categoryName) {
      const existingCategory = await this.articleCategoryRepository.findOne({
        where: {
          categoryName: categoryName.trim(),
          deletedAt: null,
        },
      });

      if (existingCategory) {
        throw new BadRequestException('Tên danh mục đã tồn tại trong hệ thống');
      }
    }

    // Kiểm tra trùng slug (nếu có thay đổi slug)
    if (categorySlug && categorySlug !== category.categorySlug) {
      const existingSlug = await this.articleCategoryRepository.findOne({
        where: {
          categorySlug: categorySlug.trim(),
          deletedAt: null,
        },
      });

      if (existingSlug) {
        throw new BadRequestException(
          'Slug danh mục đã tồn tại trong hệ thống',
        );
      }
    }

    // Cập nhật thông tin danh mục
    Object.assign(category, {
      ...updateArticleCategoryDto,
      updatedBy: user.id,
    });

    const updatedCategory = await this.articleCategoryRepository.save(category);

    // Trả về thông tin danh mục đã cập nhật
    const updatedCategoryResponse: ArticleCategoryResponse = {
      id: updatedCategory.id,
      categoryName: updatedCategory.categoryName,
      categoryDescription: updatedCategory.categoryDescription,
      categoryStatus: updatedCategory.categoryStatus,
      categorySlug: updatedCategory.categorySlug,
      categoryImage: updatedCategory.categoryImage,
      sortOrder: updatedCategory.sortOrder,
      createdAt: updatedCategory.createdAt,
      updatedAt: updatedCategory.updatedAt,
    };

    return new BaseResponse(
      HttpStatus.OK,
      'Cập nhật danh mục bài viết thành công',
      updatedCategoryResponse,
    );
  }

  // Xóa danh mục bài viết theo id
  async removeArticleCategoryById(user: JwtPayloadUser, categoryId: number) {
    const category = await this.articleCategoryRepository.findOne({
      where: {
        id: categoryId,
        deletedAt: null,
      },
      relations: ['articles'],
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy thông tin danh mục bài viết');
    }

    if (category.articles && category.articles.length > 0) {
      throw new BadRequestException(
        'Không thể xóa vì danh mục này đang có bài viết',
      );
    }

    // Thực hiện xóa mềm
    await this.articleCategoryRepository.softDelete(categoryId);

    return new BaseResponse(
      HttpStatus.OK,
      'Xóa danh mục bài viết thành công',
      null,
    );
  }

  // Lấy danh sách danh mục cho dropdown
  async getArticleCategoriesForDropdown() {
    const categories = await this.articleCategoryRepository.find({
      where: {
        categoryStatus: ArticleCategoryStatus.ACTIVE,
        deletedAt: null,
      },
      order: {
        sortOrder: 'ASC',
        categoryName: 'ASC',
      },
      select: ['id', 'categoryName', 'categorySlug'],
    });

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy danh sách danh mục thành công',
      categories,
    );
  }

  // Tạo slug từ tên danh mục
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
