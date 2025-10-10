import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { SearchCategoryDto } from './dto/search-category.dto';
import { CategoryStatus } from './enums/category-status.enum';
import {
  BaseResponse,
  PaginatedResponse,
} from 'src/common/responses/base-response';
import { ChangeLogsService } from '../change-logs/change-logs.service';
import { ChangeLogType } from '../change-logs/enums/change-log-type.enum';
import { ChangeLogAction } from '../change-logs/enums/change-log-action.enum';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import { CategoryResponse } from './interfaces/category.interface';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    private readonly changeLogService: ChangeLogsService,
  ) {}

  // Thêm mới danh mục
  async createCategory(
    user: JwtPayloadUser,
    createCategoryDto: CreateCategoryDto,
  ) {
    const { id } = user;

    const {
      categoryName,
      categoryDescription,
      categoryStatus = CategoryStatus.ACTIVE,
    } = createCategoryDto;

    // Kiểm tra trùng tên
    const existingCategory = await this.categoryRepository.findOne({
      where: {
        categoryName: categoryName.trim(),
        deletedAt: null,
      },
    });

    if (existingCategory) {
      throw new BadRequestException('Tên danh mục đã tồn tại trong hệ thống');
    }

    // Tạo và lưu danh mục
    const newCategory = this.categoryRepository.create({
      categoryName,
      categoryDescription,
      categoryStatus,
      createdBy: id,
    });

    const savedCategory = await this.categoryRepository.save(newCategory);

    // Tạo dữ liệu mới để lưu lịch sử thay đổi
    const newCategoryData = {
      categoryName: savedCategory.categoryName,
      categoryDescription: savedCategory.categoryDescription,
      categoryStatus: savedCategory.categoryStatus,
      createdBy: savedCategory.createdBy,
    };

    // Lưu lịch sử thay đổi
    await this.changeLogService.logChange(
      ChangeLogAction.CREATE,
      ChangeLogType.CATEGORY,
      savedCategory.id,
      null,
      newCategoryData,
      user.id,
    );

    const categoryResponse = {
      id: savedCategory.id,
      categoryName: savedCategory.categoryName,
      categoryDescription: savedCategory.categoryDescription,
      categoryStatus: savedCategory.categoryStatus,
      createdBy: savedCategory.createdBy,
    };

    return new BaseResponse(
      HttpStatus.CREATED,
      'Thêm danh mục thành công',
      categoryResponse,
    );
  }

  // Tìm kiếm và phân trang danh mục
  async searchAndPagingCategory(
    query: SearchCategoryDto,
  ): Promise<PaginatedResponse<CategoryResponse>> {
    const { keyword, currentPage = 1, pageSize = 10, categoryStatus } = query;

    // 1. Tạo query builder
    const queryBulder = this.categoryRepository.createQueryBuilder('category');

    // 2. Thêm điều kiện tìm kiếm
    if (keyword) {
      queryBulder.andWhere(
        '(category.categoryName LIKE :keyword OR category.categoryDescription LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 3. Thêm điều kiện lọc trạng thái
    if (categoryStatus) {
      queryBulder.andWhere('category.categoryStatus = :status', {
        status: categoryStatus,
      });
    }

    queryBulder.andWhere('category.deletedAt IS NULL');
    queryBulder.orderBy('category.createdAt', 'DESC');

    queryBulder.skip((currentPage - 1) * pageSize).take(pageSize);

    // 4. Đếm tổng bản ghi và lấy dữ liệu
    const [data, total] = await queryBulder.getManyAndCount();

    // 5. Tạo dữ liệu phân trang
    const paginated = data.map((category) => ({
      id: category.id,
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription,
      categoryStatus: category.categoryStatus,
      createdAt: category.createdAt,
    }));

    // 6. Trả kết quả
    return new PaginatedResponse(
      HttpStatus.OK,
      'Lấy danh sách danh mục thành công',
      paginated,
      {
        totalRecords: total,
        currentPage: +currentPage,
        pageSize: +pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    );
  }

  // Lấy thông tin chi tiết danh mục theo id danh mục
  async getCategoryDetail(categoryId: number) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy thông tin danh mục');
    }

    // Thông tin cơ bản danh mục
    const categoryDetailResponse = {
      id: category.id,
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription,
      categoryStatus: category.categoryStatus,
      statusText:
        category.categoryStatus === CategoryStatus.ACTIVE
          ? 'Đang hoạt động'
          : 'Ngưng hoạt động',
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    return new BaseResponse(
      HttpStatus.OK,
      'Lấy chi tiết danh mục thành công',
      categoryDetailResponse,
    );
  }

  // Cập nhật thông tin danh mục
  async updateCategory(
    user: JwtPayloadUser,
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const { categoryName } = updateCategoryDto;

    const category = await this.categoryRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy thông tin danh mục');
    }

    // Kiểm tra trùng tên (nếu có thay đổi tên)
    if (categoryName && categoryName !== category.categoryName) {
      const existingCategory = await this.categoryRepository.findOne({
        where: {
          categoryName: categoryName.trim(),
          deletedAt: null,
        },
      });

      if (existingCategory) {
        throw new BadRequestException('Tên danh mục đã tồn tại trong hệ thống');
      }
    }

    // Tạo bản sao danh mục cũ để lưu lịch sử thay đổi (sau khi đã kiểm tra tồn tại)
    const oldCategoryData = {
      id: category.id,
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription,
      categoryStatus:
        category.categoryStatus === CategoryStatus.ACTIVE
          ? 'Đang hoạt động'
          : 'Tạm dừng hoạt động',
    };

    // Cập nhật thông tin danh mục
    Object.assign(category, {
      ...updateCategoryDto,
      categoryStatus: updateCategoryDto.categoryStatus,
    });

    const updatedCategory = await this.categoryRepository.save(category);

    // Tạo dữ liệu mới để lưu lịch sử
    const newCategoryData = {
      id: updatedCategory.id,
      categoryName: updatedCategory.categoryName,
      categoryDescription: updatedCategory.categoryDescription,
      categoryStatus:
        updatedCategory.categoryStatus === CategoryStatus.ACTIVE
          ? 'Đang hoạt động'
          : 'Tạm dừng hoạt động',
    };

    // Lưu lịch sử thay đổi với dữ liệu chi tiết
    await this.changeLogService.logChange(
      ChangeLogAction.UPDATE,
      ChangeLogType.CATEGORY,
      category.id,
      oldCategoryData,
      newCategoryData,
      user.id,
    );

    // Trả về thông tin danh mục đã cập nhật
    const updatedCategoryResponse = {
      id: updatedCategory.id,
      categoryName: updatedCategory.categoryName,
      categoryDescription: updatedCategory.categoryDescription,
      categoryStatus: updatedCategory.categoryStatus,
      statusText:
        updatedCategory.categoryStatus === CategoryStatus.ACTIVE
          ? 'Đang hoạt động'
          : 'Ngưng hoạt động',
      updatedAt: updatedCategory.updatedAt,
    };

    return new BaseResponse(
      HttpStatus.OK,
      'Cập nhật danh mục thành công',
      updatedCategoryResponse,
    );
  }

  // Xóa danh mục theo id
  async removeCategoryById(user: JwtPayloadUser, categoryId: number) {
    const category = await this.categoryRepository.findOne({
      where: {
        id: categoryId,
        deletedAt: null,
      },
      withDeleted: false,
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy thông tin danh mục');
    }

    if (category.products && category.products.length > 0) {
      throw new BadRequestException(
        'Không thể xóa vì danh mục này đang có sản phẩm',
      );
    }

    // Lưu thông tin danh mục trước khi xóa để ghi log
    const deletedCategoryData = {
      id: category.id,
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription,
      categoryStatus: category.categoryStatus,
      deletedAt: new Date().toISOString(),
    };

    // Thực hiện xóa mềm
    await this.categoryRepository.softDelete(categoryId);

    // Lưu lịch sử xóa
    await this.changeLogService.logChange(
      ChangeLogAction.DELETE,
      ChangeLogType.CATEGORY,
      categoryId,
      deletedCategoryData,
      null,
      user.id,
    );

    return new BaseResponse(HttpStatus.OK, 'Xóa danh mục thành công', null);
  }
}
