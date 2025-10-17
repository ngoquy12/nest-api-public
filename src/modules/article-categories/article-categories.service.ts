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

    const { name, description, image } = createArticleCategoryDto as any;

    const safeName = typeof name === 'string' ? name.trim() : '';
    if (!safeName) {
      throw new BadRequestException('Tên danh mục là bắt buộc');
    }
    const safeDescription =
      typeof description === 'string' ? description.trim() : undefined;
    const safeImage = typeof image === 'string' ? image.trim() : undefined;

    // Kiểm tra trùng tên
    const existingCategory = await this.articleCategoryRepository.findOne({
      where: { name: safeName },
    });

    if (existingCategory) {
      throw new BadRequestException('Tên danh mục đã tồn tại trong hệ thống');
    }

    // Bỏ kiểm tra slug vì entity đã đơn giản hóa

    // Tạo và lưu danh mục
    const newCategory = this.articleCategoryRepository.create({
      name: safeName,
      description: safeDescription,
      image: safeImage,
      createdBy: id,
    });

    const savedCategory =
      await this.articleCategoryRepository.save(newCategory);

    const categoryResponse: ArticleCategoryResponse = {
      id: savedCategory.id,
      name: savedCategory.name,
      description: savedCategory.description,
      image: savedCategory.image,
      articleCount: savedCategory.articleCount,
      createdAt: savedCategory.createdAt,
      updatedAt: savedCategory.updatedAt,
    } as any;

    return new BaseResponse(
      HttpStatus.CREATED,
      'Thêm danh mục bài viết thành công',
      categoryResponse,
    );
  }

  // Tìm kiếm và phân trang danh mục bài viết
  async searchAndPagingArticleCategory(
    query: SearchArticleCategoryDto,
  ): Promise<PaginatedResponse<ArticleCategoryResponse[]>> {
    const { keyword, currentPage = 1, pageSize = 10 } = query;

    // 1. Tạo query builder
    const queryBuilder =
      this.articleCategoryRepository.createQueryBuilder('category');

    // 2. Thêm điều kiện tìm kiếm
    if (keyword) {
      queryBuilder.andWhere(
        '(category.name LIKE :keyword OR category.description LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 3. Thêm điều kiện lọc trạng thái
    // Bỏ lọc trạng thái vì entity đã đơn giản hóa

    queryBuilder.orderBy('category.createdAt', 'DESC');

    queryBuilder.skip((currentPage - 1) * pageSize).take(pageSize);

    // 4. Đếm tổng bản ghi và lấy dữ liệu
    const [data, total] = await queryBuilder.getManyAndCount();

    // 5. Tạo dữ liệu phân trang
    const paginated = data.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      image: category.image,
      articleCount: category.articleCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    // 6. Trả kết quả
    return new PaginatedResponse<ArticleCategoryResponse[]>(
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
      where: { id: categoryId },
      relations: ['articles'],
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy thông tin danh mục bài viết');
    }

    // Thông tin cơ bản danh mục
    const categoryDetailResponse: ArticleCategoryResponse = {
      id: category.id,
      name: category.name,
      description: category.description,
      image: category.image,
      articleCount: category.articles?.length || 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    } as any;

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
    const { name } = updateArticleCategoryDto as any;

    const category = await this.articleCategoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy thông tin danh mục bài viết');
    }

    // Kiểm tra trùng tên (nếu có thay đổi tên)
    if (name && name !== category.name) {
      const existingCategory = await this.articleCategoryRepository.findOne({
        where: { name: name.trim() },
      });

      if (existingCategory) {
        throw new BadRequestException('Tên danh mục đã tồn tại trong hệ thống');
      }
    }

    // Bỏ kiểm tra slug vì entity đã đơn giản hóa

    // Cập nhật thông tin danh mục
    Object.assign(category, {
      ...updateArticleCategoryDto,
      updatedBy: user.id,
    });

    const updatedCategory = await this.articleCategoryRepository.save(category);

    // Trả về thông tin danh mục đã cập nhật
    const updatedCategoryResponse: ArticleCategoryResponse = {
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description,
      image: updatedCategory.image,
      articleCount: updatedCategory.articleCount,
      createdAt: updatedCategory.createdAt,
      updatedAt: updatedCategory.updatedAt,
    } as any;

    return new BaseResponse(
      HttpStatus.OK,
      'Cập nhật danh mục bài viết thành công',
      updatedCategoryResponse,
    );
  }

  // Xóa danh mục bài viết theo id
  async removeArticleCategoryById(user: JwtPayloadUser, categoryId: number) {
    const category = await this.articleCategoryRepository.findOne({
      where: { id: categoryId },
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
    await this.articleCategoryRepository.update(categoryId, {
      deletedAt: new Date(),
    });

    return new BaseResponse(
      HttpStatus.OK,
      'Xóa danh mục bài viết thành công',
      null,
    );
  }

  // Lấy danh sách danh mục cho dropdown
  async getArticleCategoriesForDropdown() {
    const categories = await this.articleCategoryRepository.find({
      order: { createdAt: 'DESC' },
      select: ['id', 'name'],
    });

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy danh sách danh mục thành công',
      categories,
    );
  }

  // Tạo slug từ tên danh mục
  // Slug đã bỏ
  private generateSlug(name: string): string {
    return name;
  }
}
