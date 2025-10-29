import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { Friend } from './entities/friend.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { NotificationModule } from '../notifications/notification.module';
import { ChatModule } from '../chats/chat.module';
import { NotificationService } from '../notifications/notification.service';
import { ChatGateway } from '../chats/chat.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friend, User]),
    NotificationModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [FriendController],
  providers: [
    FriendService,
    {
      provide: 'NOTIFICATION_SERVICE',
      useExisting: NotificationService,
    },
    {
      provide: 'CHAT_GATEWAY',
      useExisting: ChatGateway,
    },
  ],
  exports: [FriendService],
})
export class FriendModule {}
