import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto, SendMessageDto } from './dto/chat.dto';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

@ApiTags('Cuộc trò chuyện (Chats)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({
    summary: 'Tạo cuộc trò chuyện',
    description: 'Tạo cuộc trò chuyện private hoặc group và thêm participants.',
  })
  @ApiCreatedResponse({ description: 'Tạo thành công', type: Conversation })
  @ApiBody({ type: CreateConversationDto })
  async createConversation(
    @Request() req,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return await this.chatService.createConversation(
      req.user.id,
      createConversationDto,
    );
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Danh sách cuộc trò chuyện của tôi' })
  @ApiOkResponse({
    description: 'Danh sách cuộc trò chuyện',
    type: [Conversation],
  })
  async getUserConversations(@Request() req) {
    return await this.chatService.getUserConversations(req.user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Chi tiết cuộc trò chuyện' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Chi tiết', type: Conversation })
  async getConversation(@Request() req, @Param('id') id: string) {
    return await this.chatService.getConversationById(+id, req.user.id);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Gửi tin nhắn' })
  @ApiBody({ type: SendMessageDto })
  @ApiCreatedResponse({ description: 'Gửi thành công', type: Message })
  async sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
    return await this.chatService.sendMessage(req.user.id, sendMessageDto);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Lấy tin nhắn theo cuộc trò chuyện' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { default: 1, type: 'number' },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { default: 50, type: 'number' },
  })
  @ApiOkResponse({ description: 'Danh sách tin nhắn', type: [Message] })
  async getConversationMessages(
    @Request() req,
    @Param('id') id: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    return await this.chatService.getConversationMessages(
      +id,
      req.user.id,
      +page,
      +limit,
    );
  }

  @Post('conversations/:id/leave')
  @ApiOperation({ summary: 'Rời cuộc trò chuyện' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    description: 'Đã rời cuộc trò chuyện',
    schema: { example: { message: 'Left conversation successfully' } },
  })
  async leaveConversation(@Request() req, @Param('id') id: string) {
    await this.chatService.leaveConversation(req.user.id, +id);
    return { message: 'Left conversation successfully' };
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Đánh dấu đã đọc toàn bộ tin nhắn' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    description: 'Đã đánh dấu đọc',
    schema: { example: { message: 'Messages marked as read' } },
  })
  async markAsRead(@Request() req, @Param('id') id: string) {
    await this.chatService.markMessagesAsRead(req.user.id, +id);
    return { message: 'Messages marked as read' };
  }

  @Post('conversations/private/:userId')
  @ApiOperation({ summary: 'Tạo cuộc trò chuyện riêng tư với user khác' })
  @ApiParam({ name: 'userId', type: Number })
  @ApiCreatedResponse({
    description: 'Tạo thành công (hoặc trả về cuộc trò chuyện đã tồn tại)',
    type: Conversation,
  })
  async createPrivateConversation(
    @Request() req,
    @Param('userId') userId: string,
  ) {
    return await this.chatService.createPrivateConversation(
      req.user.id,
      +userId,
    );
  }
}
