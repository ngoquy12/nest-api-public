import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CurrentUser } from '../auths/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiTags('Quản lý bình luận (Comments)')
@Controller({ version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bình luận mới' })
  @ApiResponse({ status: 201, description: 'Tạo bình luận thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy bài viết hoặc bình luận cha',
  })
  async createComment(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(user, createCommentDto);
  }

  @Get('article/:articleId')
  @ApiOperation({ summary: 'Lấy danh sách bình luận của bài viết' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách bình luận thành công',
  })
  async getCommentsByArticle(
    @Param('articleId', ParseIntPipe) articleId: number,
  ) {
    return this.commentsService.getCommentsByArticle(articleId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật bình luận' })
  @ApiResponse({ status: 200, description: 'Cập nhật bình luận thành công' })
  @ApiResponse({
    status: 400,
    description: 'Bạn không có quyền cập nhật bình luận này',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bình luận' })
  async updateComment(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(user, id, updateCommentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bình luận' })
  @ApiResponse({ status: 200, description: 'Xóa bình luận thành công' })
  @ApiResponse({
    status: 400,
    description: 'Bạn không có quyền xóa bình luận này',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bình luận' })
  async deleteComment(
    @CurrentUser() user: JwtPayloadUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commentsService.deleteComment(user, id);
  }
}
