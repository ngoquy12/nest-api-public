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
  Patch,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchArticleDto } from './dto/search-article.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';

@ApiTags('Articles')
@ApiBearerAuth()
@Controller({ version: '1' })
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'API thêm mới bài viết - Cần đăng nhập mới có quyền thao tác',
  })
  async createArticle(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createArticleDto: CreateArticleDto,
  ) {
    return await this.articlesService.createArticle(user, createArticleDto);
  }

  @Get('search-paging')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy danh sách, tìm kiếm, phân trang, sắp xếp, lọc dữ liệu bài viết - Cần đăng nhập mới có quyền thao tác',
  })
  searchAndPagingArticle(@Query() query: SearchArticleDto) {
    return this.articlesService.searchAndPagingArticle(query);
  }

  @Get('detail/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy thông tin chi tiết bài viết theo ID - Cần đăng nhập mới có quyền thao tác',
  })
  getArticleDetail(@Param('id') id: string) {
    return this.articlesService.getArticleDetail(+id);
  }

  @Get('slug/:slug')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy thông tin chi tiết bài viết theo slug - Cần đăng nhập mới có quyền thao tác',
  })
  getArticleBySlug(@Param('slug') slug: string) {
    return this.articlesService.getArticleBySlug(slug);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API cập nhật thông tin bài viết - Cần đăng nhập mới có quyền thao tác',
  })
  updateArticle(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.updateArticle(user, +id, updateArticleDto);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'API xuất bản bài viết - Cần đăng nhập mới có quyền thao tác',
  })
  publishArticle(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.articlesService.publishArticle(user, +id);
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'API lưu trữ bài viết - Cần đăng nhập mới có quyền thao tác',
  })
  archiveArticle(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.articlesService.archiveArticle(user, +id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'API xóa thông tin bài viết - Cần đăng nhập mới có quyền thao tác',
  })
  removeArticleById(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    return this.articlesService.removeArticleById(user, +id);
  }
}
