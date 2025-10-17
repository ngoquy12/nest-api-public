import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { SearchArticleDto } from './dto/search-article.dto';
import { CurrentUser } from '../auths/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ArticlesService } from './articles.service';

@ApiTags('Quản lý bài viết (Articles)')
@Controller({ version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  @ApiResponse({ status: 201, description: 'Tạo bài viết thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy danh mục' })
  async createArticle(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createArticleDto: CreateArticleDto,
  ) {
    return this.articlesService.createArticle(user, createArticleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài viết' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách bài viết thành công',
  })
  async getArticles(@Query() searchArticleDto: SearchArticleDto) {
    return this.articlesService.getArticles(searchArticleDto);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Lấy tất cả bài viết (không phân trang, không tìm kiếm)',
  })
  @ApiResponse({ status: 200, description: 'Lấy tất cả bài viết thành công' })
  async getAllArticles() {
    return this.articlesService.getAllArticles();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết bài viết' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết bài viết thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  async getArticleDetail(@Param('id', ParseIntPipe) id: number) {
    return this.articlesService.getArticleDetail(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  @ApiResponse({ status: 200, description: 'Cập nhật bài viết thành công' })
  @ApiResponse({
    status: 400,
    description: 'Bạn không có quyền cập nhật bài viết này',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  async updateArticle(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.updateArticle(user, id, updateArticleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bài viết' })
  @ApiResponse({ status: 200, description: 'Xóa bài viết thành công' })
  @ApiResponse({
    status: 400,
    description: 'Bạn không có quyền xóa bài viết này',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  async deleteArticle(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.articlesService.deleteArticle(user, id);
  }
}
