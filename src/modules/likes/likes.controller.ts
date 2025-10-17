import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { CurrentUser } from '../auths/decorators/current-user.decorator';
import { JwtPayloadUser } from '../auths/interfaces/jwt-payload-user';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiTags('Quản lý like (Likes)')
@Controller({ version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LikesController {
  constructor(private readonly likesSimpleService: LikesService) {}

  @Post('toggle')
  @ApiOperation({ summary: 'Like/Unlike bài viết hoặc bình luận' })
  @ApiResponse({ status: 200, description: 'Like/Unlike thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy bài viết hoặc bình luận',
  })
  async toggleLike(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createLikeDto: CreateLikeDto,
  ) {
    return this.likesSimpleService.toggleLike(user, createLikeDto);
  }

  @Get('article/:articleId')
  @ApiOperation({ summary: 'Lấy danh sách người đã like bài viết' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách like thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  async getArticleLikes(@Param('articleId', ParseIntPipe) articleId: number) {
    return this.likesSimpleService.getArticleLikes(articleId);
  }

  @Get('comment/:commentId')
  @ApiOperation({ summary: 'Lấy danh sách người đã like bình luận' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách like thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bình luận' })
  async getCommentLikes(@Param('commentId', ParseIntPipe) commentId: number) {
    return this.likesSimpleService.getCommentLikes(commentId);
  }
}
