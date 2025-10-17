import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Put,
  UseInterceptors,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleCode } from 'src/common/enums/role-code.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import { SearchAndPagingProductDto } from './dto/search-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Quản lý sản phẩm (Products)')
@Controller({ version: '1' })
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateProductDto,
    description: 'Thông tin sản phẩm cần thêm mới',
  })
  @ApiOperation({
    summary: 'Tạo sản phẩm mới',
    description: `
      API tạo sản phẩm mới với thông tin:
      - Thông tin cơ bản: tên, mã, giá, mô tả
      - Danh mục sản phẩm (chỉ 1 danh mục)
      - Hình ảnh sản phẩm (tối đa 10 ảnh, mỗi ảnh tối đa 2MB)
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
    `,
  })
  createProduct(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: JwtPayloadUser,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.productsService.createProduct(createProductDto, user, images);
  }

  @Post('generate-product-code')
  @UseGuards(JwtAuthGuard)
  @Roles(RoleCode.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'API tạo mã sản phẩm - Chỉ chử cửa hàng hoặc quản lý chi nhánh mới có quyền',
  })
  generateProductCode() {
    return this.productsService.generateProductCode();
  }

  @Get('search-paging')
  @UseGuards(JwtAuthGuard)
  @Roles(RoleCode.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tìm kiếm và phân trang sản phẩm',
    description: `
      API tìm kiếm sản phẩm với các tiêu chí:
      - Tìm kiếm theo từ khóa (tên sản phẩm, mã sản phẩm)
      - Lọc theo danh mục sản phẩm
      - Lọc theo trạng thái sản phẩm
      - Phân trang kết quả
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
    `,
  })
  searchAndPagingProducts(
    @CurrentUser() user: JwtPayloadUser,
    @Query() query: SearchAndPagingProductDto,
  ) {
    return this.productsService.searchAndPagingProducts(user, query);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy toàn bộ sản phẩm (không phân trang, không tìm kiếm)',
    description:
      'API trả về toàn bộ sản phẩm chưa bị xóa theo format giống API tìm kiếm, phân trang.',
  })
  listAllProducts() {
    return this.productsService.listAllProducts();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết sản phẩm',
    description: `
      API lấy thông tin chi tiết của một sản phẩm bao gồm:
      - Thông tin cơ bản: tên, mã, giá, mô tả, trạng thái
      - Thông tin danh mục
      - Danh sách hình ảnh
      - Thông tin tạo/cập nhật
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
    `,
  })
  findOneProduct(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.productsService.findOneProduct(user, +id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images'))
  @ApiBody({
    type: UpdateProductDto,
    description: 'Thông tin sản phẩm cần cập nhật',
  })
  @ApiOperation({
    summary: 'Cập nhật thông tin sản phẩm',
    description: `
      API cập nhật thông tin sản phẩm bao gồm:
      - Cập nhật thông tin cơ bản
      - Thay đổi danh mục sản phẩm
      - Thêm/xóa hình ảnh
      - Cập nhật trạng thái sản phẩm
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
    `,
  })
  updateProduct(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    return this.productsService.updateProduct(
      user,
      +id,
      updateProductDto,
      images,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(RoleCode.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa sản phẩm',
    description: `
      API xóa sản phẩm (soft delete):
      - Đánh dấu sản phẩm là đã xóa
      - Không xóa thực sự khỏi database
      - Có thể khôi phục nếu cần
      
      **Quyền truy cập:** Chỉ quản lý chi nhánh
    `,
  })
  deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(+id);
  }
}
