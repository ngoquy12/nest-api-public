import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchLikeDto } from './dto/search-like.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';

@ApiTags('Likes')
@ApiBearerAuth()
@Controller({ version: '1', path: 'likes' })
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API thêm like cho bài viết hoặc bình luận - Cần đăng nhập mới có quyền thao tác',
  })
  async createLike(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createLikeDto: CreateLikeDto,
  ) {
    return await this.likesService.createLike(user, createLikeDto);
  }

  @Get('search-paging')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy danh sách, tìm kiếm, phân trang, sắp xếp, lọc dữ liệu like - Cần đăng nhập mới có quyền thao tác',
  })
  searchAndPagingLike(@Query() query: SearchLikeDto) {
    return this.likesService.searchAndPagingLike(query);
  }

  @Get('article/:articleId/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy thống kê like của bài viết - Cần đăng nhập mới có quyền thao tác',
  })
  getArticleLikeStats(
    @Param('articleId') articleId: string,
    @Query('userId') userId?: string,
  ) {
    return this.likesService.getArticleLikeStats(
      +articleId,
      userId ? +userId : undefined,
    );
  }

  @Get('comment/:commentId/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy thống kê like của bình luận - Cần đăng nhập mới có quyền thao tác',
  })
  getCommentLikeStats(
    @Param('commentId') commentId: string,
    @Query('userId') userId?: string,
  ) {
    return this.likesService.getCommentLikeStats(
      +commentId,
      userId ? +userId : undefined,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'API xóa like - Cần đăng nhập mới có quyền thao tác',
  })
  removeLike(@CurrentUser() user: JwtPayloadUser, @Param('id') id: string) {
    return this.likesService.removeLike(user, +id);
  }
}
