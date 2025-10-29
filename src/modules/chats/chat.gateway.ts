import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { NotificationService } from '../notifications/notification.service';
import { SendMessageDto } from './dto/chat.dto';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<number, string>(); // userId -> socketId

  constructor(
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization;
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token and get user info
      const user = await this.chatService.verifyToken(token);
      if (!user) {
        client.disconnect();
        return;
      }

      // Store user connection
      this.connectedUsers.set(user.id, client.id);
      client.data.userId = user.id;

      // Join user to their personal room
      await client.join(`user_${user.id}`);

      console.log(`User ${user.id} connected with socket ${client.id}`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      const message = await this.chatService.sendMessage(userId, data);

      // Emit to all participants in the conversation
      const participants = await this.chatService.getConversationParticipants(
        data.conversationId,
      );

      for (const participant of participants) {
        if (participant.userId !== userId) {
          // Send to user's personal room
          this.server.to(`user_${participant.userId}`).emit('new_message', {
            message,
            conversationId: data.conversationId,
          });

          // Create notification for offline users
          await this.notificationService.createNotification({
            userId: participant.userId,
            type: 'message_received' as any,
            title: 'New Message',
            content: message.content,
            data: JSON.stringify({
              conversationId: data.conversationId,
              senderId: userId,
            }),
          });
        }
      }

      // Send confirmation back to sender
      client.emit('message_sent', {
        message,
        conversationId: data.conversationId,
      });
    } catch (error) {
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      await client.join(`conversation_${data.conversationId}`);

      // Notify others in the conversation
      client.to(`conversation_${data.conversationId}`).emit('user_joined', {
        userId,
        conversationId: data.conversationId,
      });
    } catch (error) {
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      await client.leave(`conversation_${data.conversationId}`);

      // Notify others in the conversation
      client.to(`conversation_${data.conversationId}`).emit('user_left', {
        userId,
        conversationId: data.conversationId,
      });
    } catch (error) {
      client.emit('error', { message: 'Failed to leave conversation' });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { conversationId: number; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    client.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { conversationId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      await this.chatService.markMessagesAsRead(userId, data.conversationId);

      // Notify sender that message was read
      client.to(`conversation_${data.conversationId}`).emit('message_read', {
        userId,
        conversationId: data.conversationId,
      });
    } catch (error) {
      client.emit('error', { message: 'Failed to mark as read' });
    }
  }

  // Method to send notification to specific user
  async sendNotificationToUser(userId: number, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
    }
  }

  // Method to check if user is online
  isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }
}
