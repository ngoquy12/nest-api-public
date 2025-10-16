import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SearchCategoryDto } from './dto/search-category.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';

@ApiTags('Quản lý danh mục (Categories)')
@ApiBearerAuth()
@Controller({ version: '1' })
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'API thêm mới danh mục - Cần đăng nhập mới có quyền thao tác',
  })
  async createCategory(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    return await this.categoriesService.createCategory(user, createCategoryDto);
  }

  @Get('search-paging')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy danh sách, tìm kiếm, phân trang, sắp xếp, lọc dữ liệu - Cần đăng nhập mới có quyền thao tác',
  })
  searchAndPagingCategory(@Query() query: SearchCategoryDto) {
    return this.categoriesService.searchAndPagingCategory(query);
  }

  @Get('detail/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy thông tin chi tiết danh mục - Cần đăng nhập mới có quyền thao tác',
  })
  getCategoryDetail(@Param('id') id: string) {
    return this.categoriesService.getCategoryDetail(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API cập nhật thông tin danh mục - Cần đăng nhập mới có quyền thao tác',
  })
  updateCategory(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(user, +id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'API xóa thông tin danh mục - Cần đăng nhập mới có quyền thao tác',
  })
  removeCategoryById(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    return this.categoriesService.removeCategoryById(user, +id);
  }
}
