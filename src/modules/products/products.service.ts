import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, Not, Repository } from 'typeorm';
import {
  BaseResponse,
  PaginatedResponse,
} from 'src/common/responses/base-response';
import { Category } from '../categories/entities/category.entity';
import { SearchAndPagingProductDto } from './dto/search-product.dto';
import {
  ProductPaginationResponse,
  ProductResponse,
} from './interfaces/product.interface';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { Image } from '../images/entities/image.entity';
import { TypeImage } from 'src/common/enums/type-image.enum';
import { ImagesService } from '../images/services/images.service';

import { formatFromDecimalToNumber } from 'src/common/utils/formatData';
import { formatMoneyByUnit } from 'src/common/utils/formatData';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,

    private readonly cloudinaryService: CloudinaryService,

    private readonly imagesService: ImagesService,

    private readonly dataSource: DataSource,
  ) {}

  // Kiểm tra tính duy nhất của mã và tên sản phẩm trong
  private async ensureProductUniqueness(
    productId: number | null,
    type: 'create' | 'update',
    productName: string,
    productCode?: string,
  ) {
    const commonWhere: any = {};

    const nameWhere: any = {
      productName: productName?.trim(),
      ...commonWhere,
    };

    const codeWhere: any = {
      ...(productCode && { productCode: productCode.trim() }),
      ...commonWhere,
    };

    // Nếu đang update, loại trừ sản phẩm hiện tại khỏi kiểm tra
    if (type === 'update' && productId !== null) {
      nameWhere.id = Not(productId);
      if (productCode) {
        codeWhere.id = Not(productId);
      }
    }

    const [nameExists, codeExists] = await Promise.all([
      this.productRepository.findOne({ where: nameWhere }),
      productCode ? this.productRepository.findOne({ where: codeWhere }) : null,
    ]);

    if (nameExists) {
      throw new BadRequestException(
        `Tên sản phẩm ${productName?.trim()} đã tồn tại trong  hệ thống`,
      );
    }

    if (productCode && codeExists) {
      throw new BadRequestException(
        `Mã sản phẩm ${productCode.trim()} đã tồn tại trong  hệ thống`,
      );
    }
  }

  // Kiểm tra tính hợp lệ của các danh mục sản phẩm
  private async getValidCategories(categoryIds: number[]): Promise<Category[]> {
    const categories: Category[] = [];

    for (const categoryId of categoryIds) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: categoryId,
          deletedAt: null,
        },
      });

      if (!category) {
        throw new NotFoundException(
          `Không tìm thấy danh mục có Id: ${categoryId}`,
        );
      }

      categories.push(category);
    }

    return categories;
  }

  // Tạo mã sản phẩm ngẫu nhiên
  private generateShortProductCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'PR';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Lấy các trường cần thiết từ đối tượng sản phẩm và trả về một đối tượng mới
  private mapProductResponse(product: Product): ProductPaginationResponse {
    const price = formatFromDecimalToNumber(product?.price);

    console.log('Product: ', product);

    return {
      id: product.id,
      productCode: product.productCode,
      productName: product.productName,
      price,
      priceFull: formatMoneyByUnit(price),
      productStatus: product.productStatus,
      description: product.description,
      category: {
        id: product.category.id,
        categoryName: product.category.categoryName,
        categoryStatus: product.category.categoryStatus,
        categoryDescription: product.category.categoryDescription,
      },
      createdAt: product.createdAt,
      images: [],
    };
  }

  // Tạo mới sản phẩm
  async createProduct(
    createProductDto: CreateProductDto,
    user: JwtPayloadUser,
    images: Express.Multer.File[],
  ): Promise<BaseResponse<ProductResponse>> {
    const { productName, categoryId, productCode } = createProductDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Kiểm tra trùng mã, tên sản phẩm
      await this.ensureProductUniqueness(
        null,
        'create',
        productName,
        productCode,
      );

      // 3. Kiểm tra danh mục
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId, deletedAt: null },
      });

      if (!category) {
        throw new BadRequestException('Không tìm thấy danh mục hợp lệ');
      }

      // 5. Validate ảnh
      if (images.length > 10) {
        throw new BadRequestException('Chỉ được upload tối đa 10 ảnh');
      }

      for (const file of images) {
        const maxSizeInBytes = 2 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
          throw new BadRequestException(
            `Ảnh "${file.originalname}" vượt quá 2MB`,
          );
        }
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          throw new BadRequestException(
            `Ảnh "${file.originalname}" sai định dạng (jpg, jpeg, png)`,
          );
        }
      }

      // 6. Tạo sản phẩm
      const newProduct = this.productRepository.create({
        ...createProductDto,
        category: category,
      });

      const savedProduct = await queryRunner.manager.save(newProduct);

      // Load lại product với relation category
      const productWithCategory = await queryRunner.manager.findOne(Product, {
        where: { id: savedProduct.id },
        relations: ['category'],
      });

      // 7. Upload ảnh và lưu vào DB
      const savedImages = [];

      for (const file of images || []) {
        const uploaded = await this.cloudinaryService.uploadImage(file);
        const image = this.imageRepository.create({
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          refId: savedProduct.id,
          type: TypeImage.PRODUCT,
        });
        savedImages.push(image);
      }

      if (savedImages.length > 0) {
        await queryRunner.manager.save(savedImages);
      }

      await queryRunner.commitTransaction();

      // 8. Trả về kết quả
      return new BaseResponse(
        HttpStatus.CREATED,
        'Thêm mới sản phẩm thành công',
        {
          ...this.mapProductResponse(productWithCategory),
          images: savedImages.map((img) => {
            return {
              id: img.id,
              url: img.url,
              publicId: img.publicId,
            };
          }),
        },
      );
    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof HttpException) {
        throw err;
      }

      console.log('error: ', err);

      // Nếu là lỗi không xác định → trả 500
      throw new InternalServerErrorException('Thêm mới sản phẩm thất bại: ');
    } finally {
      await queryRunner.release();
    }
  }

  // Tạo mã sản phẩm
  async generateProductCode(): Promise<BaseResponse<string>> {
    // Tạo mã sản phẩm ngẫu nhiên
    const fullProductCode = this.generateShortProductCode();

    // Kiểm tra trùng mã
    const existing = await this.productRepository.findOne({
      where: {
        productCode: fullProductCode,
      },
    });

    if (existing) {
      throw new BadRequestException('Mã sản phẩm đã tồn tại');
    }

    // Trả về phản hồi thành công với mã sản phẩm đã tạo
    return new BaseResponse(
      HttpStatus.CREATED,
      'Tạo mã sản phẩm thành công',
      fullProductCode,
    );
  }

  // Tìm kiếm và phân trang danh sách sản phẩm
  async searchAndPagingProducts(
    user: JwtPayloadUser,
    query: SearchAndPagingProductDto,
  ): Promise<PaginatedResponse<ProductPaginationResponse>> {
    const {
      keyword,
      pageSize = 10,
      currentPage = 1,
      categoryId,
      productStatus,
    } = query;

    // Tạo truy vấn cơ sở dữ liệu
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .andWhere('product.deleted_at IS NULL');

    // Tìm kiếm theo từ khóa với mã sản phẩm, tên sản phẩm
    if (keyword) {
      queryBuilder.andWhere(
        '(product.productCode LIKE :keyword OR product.productName LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // Lọc theo trạng thái sản phẩm
    if (productStatus) {
      queryBuilder.andWhere('product.productStatus = :productStatus', {
        productStatus,
      });
    }

    // Lọc theo danh mục sản phẩm
    if (categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId,
      });
    }

    // Phân trang
    const skip = (currentPage - 1) * pageSize;
    queryBuilder.take(pageSize).skip(skip);

    // Thực hiện truy vấn
    const [products, totalRecords] = await queryBuilder.getManyAndCount();

    // Tổng số trang
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Chuyển đổi sản phẩm sang định dạng phản hồi
    const productResponses = products.map((p) => this.mapProductResponse(p));

    // Tìm kiếm hình ảnh sản phẩm và thông tin chi nhánh có cùng sản phẩm
    for (const productResponse of productResponses) {
      const images = await this.imageRepository.find({
        where: { refId: productResponse.id, type: TypeImage.PRODUCT },
      });
      if (images.length > 0) {
        productResponse.images = images.map((img) => ({
          id: img.id,
          url: img.url,
          publicId: img.publicId,
        }));
      } else {
        productResponse.images = [];
      }
    }

    // Trả về phản hồi phân trang
    return new PaginatedResponse(
      HttpStatus.OK,
      'Lấy danh sách sản phẩm thành công',
      productResponses,
      {
        currentPage,
        pageSize,
        totalRecords,
        totalPages,
      },
    );
  }

  // Lấy toàn bộ sản phẩm (không tìm kiếm, không phân trang) nhưng trả về cùng format
  async listAllProducts(): Promise<BaseResponse<ProductPaginationResponse[]>> {
    // Lấy tất cả sản phẩm chưa bị xóa kèm category
    const products = await this.productRepository.find({
      where: { deletedAt: null },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });

    const productResponses = products.map((p) => this.mapProductResponse(p));

    // Nạp ảnh cho từng sản phẩm
    for (const productResponse of productResponses) {
      const images = await this.imageRepository.find({
        where: { refId: productResponse.id, type: TypeImage.PRODUCT },
      });
      productResponse.images = images.map((img) => ({
        id: img.id,
        url: img.url,
        publicId: img.publicId,
      }));
    }

    return new BaseResponse<ProductPaginationResponse[]>(
      HttpStatus.OK,
      'Lấy danh sách sản phẩm thành công',
      productResponses,
    );
  }

  // Lấy thông tin chi tiết một sản phẩm theo Id
  async findOneProduct(
    user: JwtPayloadUser,
    id: number,
  ): Promise<BaseResponse<ProductResponse>> {
    // Tìm sản phẩm theo Id
    const product = await this.productRepository.findOne({
      where: {
        id,
        deletedAt: null,
      },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    // Chuyển đổi sản phẩm sang định dạng phản hồi
    const productResponse = this.mapProductResponse(product);

    // Tìm kiếm hình ảnh sản phẩm
    const image = await this.imageRepository.find({
      where: { refId: productResponse.id, type: TypeImage.PRODUCT },
    });

    // Trả về phản hồi thành công với thông tin sản phẩm
    return new BaseResponse(
      HttpStatus.OK,
      'Lấy thông tin sản phẩm thành công',
      {
        ...productResponse,
        price: formatFromDecimalToNumber(productResponse.price),
        priceFull: formatMoneyByUnit(product.price),
        images: image.map((img) => ({
          id: img.id,
          url: img.url,
          publicId: img.publicId,
        })),
      },
    );
  }

  // Cập nhật thông tin sản phẩm theo Id
  async updateProduct(
    user: JwtPayloadUser,
    id: number,
    updateProductDto: UpdateProductDto,
    images?: Express.Multer.File[],
  ): Promise<BaseResponse<ProductResponse>> {
    const { productName, categoryId, productCode, keepImageIds } =
      updateProductDto;

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await this.productRepository.findOne({
      where: {
        id,
        deletedAt: null,
      },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    await this.ensureProductUniqueness(id, 'update', productName, productCode);

    // Kiểm tra danh mục nếu có thay đổi
    let category = product.category;
    if (categoryId && categoryId !== product.category?.id) {
      category = await this.categoryRepository.findOne({
        where: { id: categoryId, deletedAt: null },
      });

      if (!category) {
        throw new BadRequestException('Không tìm thấy danh mục hợp lệ');
      }
    }

    // ====== BẮT ĐẦU TRANSACTION ======
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Cập nhật dữ liệu chính
      Object.assign(product, updateProductDto, {
        category,
      });

      const updatedProduct = await queryRunner.manager.save(product);

      // Xử lý ảnh
      const oldImages = await this.imageRepository.find({
        where: { refId: product.id, type: TypeImage.PRODUCT },
      });

      const keepIds = Array.isArray(keepImageIds)
        ? keepImageIds.map(Number)
        : keepImageIds
          ? [Number(keepImageIds)]
          : [];

      const imagesToDelete = oldImages.filter(
        (img) => !keepIds.includes(img.id),
      );

      await Promise.all(
        imagesToDelete.map(async (img) => {
          try {
            if (img.publicId && this.cloudinaryService?.deleteImage) {
              await this.cloudinaryService.deleteImage(img.publicId);
            }
            await queryRunner.manager.delete(
              this.imageRepository.target,
              img.id,
            );
          } catch (error) {
            await queryRunner.manager.delete(
              this.imageRepository.target,
              img.id,
            );
          }
        }),
      );

      // Upload ảnh song song
      const uploadedImages = await Promise.all(
        (images || []).map(async (file) => {
          const uploaded = await this.cloudinaryService.uploadImage(file);
          return this.imageRepository.create({
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            refId: product.id,
            type: TypeImage.PRODUCT,
          });
        }),
      );

      if (uploadedImages.length > 0) {
        await queryRunner.manager.save(uploadedImages);
      }

      await queryRunner.commitTransaction();

      // Mapping kết quả trả về
      const productResponse = this.mapProductResponse(updatedProduct);
      return new BaseResponse(HttpStatus.OK, 'Cập nhật sản phẩm thành công', {
        ...productResponse,
        images: [
          ...oldImages
            .filter((img) => keepIds.includes(img.id))
            .map((img) => ({ id: img.id, url: img.url })),
          ...uploadedImages.map((img) => ({
            id: img.id,
            url: img.url,
            publicId: img.publicId,
          })),
        ],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Cập nhật sản phẩm thất bại: ' + (error?.message || error),
      );
    } finally {
      await queryRunner.release();
    }
  }

  // Xóa sản phẩm theo Id
  async deleteProduct(id: number): Promise<BaseResponse<null>> {
    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException('Không tìm thấy thông tin sản phẩm');
    }

    // Xóa sản phẩm
    await this.productRepository.softDelete(id);

    // Trả về phản hồi thành công
    return new BaseResponse(HttpStatus.OK, 'Xóa sản phẩm thành công', null);
  }
}
