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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchCommentDto } from './dto/search-comment.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller({ version: '1', path: 'comments' })
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'API thêm mới bình luận - Cần đăng nhập mới có quyền thao tác',
  })
  async createComment(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return await this.commentsService.createComment(user, createCommentDto);
  }

  @Get('search-paging')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy danh sách, tìm kiếm, phân trang, sắp xếp, lọc dữ liệu bình luận - Cần đăng nhập mới có quyền thao tác',
  })
  searchAndPagingComment(@Query() query: SearchCommentDto) {
    return this.commentsService.searchAndPagingComment(query);
  }

  @Get('article/:articleId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy danh sách bình luận theo cây cho một bài viết - Cần đăng nhập mới có quyền thao tác',
  })
  getCommentsByArticleId(@Param('articleId') articleId: string) {
    return this.commentsService.getCommentsByArticleId(+articleId);
  }

  @Get('detail/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API lấy thông tin chi tiết bình luận - Cần đăng nhập mới có quyền thao tác',
  })
  getCommentDetail(@Param('id') id: string) {
    return this.commentsService.getCommentDetail(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API cập nhật thông tin bình luận - Cần đăng nhập mới có quyền thao tác',
  })
  updateComment(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(user, +id, updateCommentDto);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'API duyệt bình luận - Cần đăng nhập mới có quyền thao tác',
  })
  approveComment(@Param('id') id: string) {
    return this.commentsService.approveComment(+id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'API từ chối bình luận - Cần đăng nhập mới có quyền thao tác',
  })
  rejectComment(@Param('id') id: string) {
    return this.commentsService.rejectComment(+id);
  }

  @Patch(':id/spam')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API đánh dấu spam bình luận - Cần đăng nhập mới có quyền thao tác',
  })
  markAsSpam(@Param('id') id: string) {
    return this.commentsService.markAsSpam(+id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'API xóa thông tin bình luận - Cần đăng nhập mới có quyền thao tác',
  })
  removeCommentById(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id') id: string,
  ) {
    return this.commentsService.removeCommentById(user, +id);
  }
}
