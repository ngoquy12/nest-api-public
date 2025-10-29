import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { FriendService } from './friend.service';
import {
  SendFriendRequestDto,
  RespondToFriendRequestDto,
} from './dto/friend.dto';
import { Friend } from './entities/friend.entity';
import { User } from 'src/modules/users/entities/user.entity';

@ApiTags('Bạn bè (Friends)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post('requests')
  @ApiOperation({ summary: 'Gửi lời mời kết bạn' })
  @ApiBody({ type: SendFriendRequestDto })
  @ApiCreatedResponse({ description: 'Tạo lời mời thành công', type: Friend })
  async sendFriendRequest(
    @Request() req,
    @Body() sendFriendRequestDto: SendFriendRequestDto,
  ) {
    return await this.friendService.sendFriendRequest(
      req.user.id,
      sendFriendRequestDto,
    );
  }

  @Post('requests/:id/respond')
  @ApiOperation({ summary: 'Phản hồi lời mời kết bạn' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: RespondToFriendRequestDto })
  @ApiOkResponse({ description: 'Cập nhật thành công', type: Friend })
  async respondToFriendRequest(
    @Request() req,
    @Param('id') id: string,
    @Body() respondDto: RespondToFriendRequestDto,
  ) {
    respondDto.friendId = +id;
    return await this.friendService.respondToFriendRequest(
      req.user.id,
      respondDto,
    );
  }

  @Get('requests')
  @ApiOperation({ summary: 'Danh sách lời mời kết bạn tôi nhận (pending)' })
  @ApiOkResponse({ description: 'Danh sách', type: [Friend] })
  async getFriendRequests(@Request() req) {
    return await this.friendService.getFriendRequests(req.user.id);
  }

  @Get('requests/sent')
  @ApiOperation({ summary: 'Danh sách lời mời kết bạn tôi đã gửi' })
  @ApiOkResponse({ description: 'Danh sách', type: [Friend] })
  async getSentFriendRequests(@Request() req) {
    return await this.friendService.getSentFriendRequests(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách bạn bè của tôi' })
  @ApiOkResponse({ description: 'Danh sách người dùng', type: [User] })
  async getFriends(@Request() req) {
    return await this.friendService.getFriends(req.user.id);
  }

  @Post(':id/remove')
  @ApiOperation({ summary: 'Xóa bạn' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    schema: { example: { message: 'Friend removed successfully' } },
  })
  async removeFriend(@Request() req, @Param('id') id: string) {
    await this.friendService.removeFriend(req.user.id, +id);
    return { message: 'Friend removed successfully' };
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Chặn người dùng' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Quan hệ chặn', type: Friend })
  async blockUser(@Request() req, @Param('id') id: string) {
    return await this.friendService.blockUser(req.user.id, +id);
  }

  @Post(':id/unblock')
  @ApiOperation({ summary: 'Bỏ chặn người dùng' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    schema: { example: { message: 'User unblocked successfully' } },
  })
  async unblockUser(@Request() req, @Param('id') id: string) {
    await this.friendService.unblockUser(req.user.id, +id);
    return { message: 'User unblocked successfully' };
  }
}
