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
import { ArticleCategoriesService } from './article-categories.service';
import { CreateArticleCategoryDto } from './dto/create-article-category.dto';
import { UpdateArticleCategoryDto } from './dto/update-article-category.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchArticleCategoryDto } from './dto/search-article-category.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';

@ApiTags('Quản lý danh mục bài viết (Article Categories)')
@ApiBearerAuth()
@Controller({ version: '1' })
export class ArticleCategoriesController {
  constructor(
    private readonly articleCategoriesService: ArticleCategoriesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API thêm mới danh mục bài viết - Cần đăng nhập mới có quyền thao tác',
  })
  async createArticleCategory(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createArticleCategoryDto: CreateArticleCategoryDto,
  ) {
    return await this.articleCategoriesService.createArticleCategory(
      user,
      createArticleCategoryDto,
    );
  }

  @Get('search-paging')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy danh sách, tìm kiếm, phân trang, sắp xếp, lọc dữ liệu danh mục bài viết - Cần đăng nhập mới có quyền thao tác',
  })
  searchAndPagingArticleCategory(@Query() query: SearchArticleCategoryDto) {
    return this.articleCategoriesService.searchAndPagingArticleCategory(query);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy tất cả danh mục bài viết (không phân trang) - Cần đăng nhập mới có quyền thao tác',
  })
  getAllCategories() {
    return this.articleCategoriesService.getAllCategories();
  }

  @Get('detail/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy thông tin chi tiết danh mục bài viết - Cần đăng nhập mới có quyền thao tác',
  })
  getArticleCategoryDetail(@Param('id') id: string) {
    return this.articleCategoriesService.getArticleCategoryDetail(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API cập nhật thông tin danh mục bài viết - Cần đăng nhập mới có quyền thao tác',
  })
  updateArticleCategory(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() updateArticleCategoryDto: UpdateArticleCategoryDto,
  ) {
    return this.articleCategoriesService.updateArticleCategory(
      user,
      +id,
      updateArticleCategoryDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API xóa thông tin danh mục bài viết - Cần đăng nhập mới có quyền thao tác',
  })
  removeArticleCategoryById(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    return this.articleCategoriesService.removeArticleCategoryById(user, +id);
  }
}
